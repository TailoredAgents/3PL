import { revalidatePath } from "next/cache";

import { upsertEmailSuppressionFromResendEvent } from "@/lib/email-suppression";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  getResendEventBody,
  getResendEventOutcome,
  getResendEventSubject,
  isTrackedResendEmailEvent,
  verifyResendWebhookEvent,
} from "@/lib/resend-webhooks";

export async function POST(request: Request) {
  const payload = await request.text();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json({
      message:
        "Resend webhook received but ignored. Configure RESEND_WEBHOOK_SECRET to verify and process events.",
    });
  }

  let event;

  try {
    event = verifyResendWebhookEvent({
      payload,
      headers: request.headers,
      webhookSecret,
    });
  } catch {
    return Response.json({ error: "Invalid Resend webhook." }, { status: 400 });
  }

  if (!isTrackedResendEmailEvent(event.type)) {
    return Response.json({ message: "Resend event ignored." });
  }

  const eventId = request.headers.get("svix-id");
  const emailId = event.data?.email_id;

  if (!eventId || !emailId) {
    return Response.json(
      { error: "Resend webhook is missing an event id or email id." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Resend webhook verified. Connect DATABASE_URL to persist email events.",
    });
  }

  const existingEvent = await prisma.activity.findUnique({
    where: { externalEventId: eventId },
  });

  if (existingEvent) {
    return Response.json({ message: "Duplicate Resend event ignored." });
  }

  const originalEmail = await prisma.activity.findFirst({
    where: {
      externalProvider: "RESEND",
      externalMessageId: emailId,
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.activity.create({
    data: {
      shipperId: originalEmail?.shipperId,
      contactId: originalEmail?.contactId,
      userId: originalEmail?.userId,
      type: "EMAIL",
      direction: "INTERNAL",
      subject: getResendEventSubject(event),
      body: getResendEventBody(event),
      outcome: getResendEventOutcome(event),
      externalProvider: "RESEND",
      externalMessageId: emailId,
      externalEventId: eventId,
    },
  });

  await upsertEmailSuppressionFromResendEvent(event, eventId);

  revalidatePath("/dashboard");
  revalidatePath("/email");
  revalidatePath("/leads");
  revalidatePath("/shippers");
  revalidatePath("/quote-requests");

  return Response.json({ message: "Resend email event logged." });
}
