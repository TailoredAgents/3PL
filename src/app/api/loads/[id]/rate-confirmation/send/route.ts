import { revalidatePath } from "next/cache";

import { getCurrentInternalUser } from "@/lib/current-user";
import type { SendEmailResult } from "@/lib/email";
import { sendTransactionalEmail } from "@/lib/email";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { buildPublicUrl } from "@/lib/twilio-voice";
import { rateConfirmationSendSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = rateConfirmationSendSchema.safeParse({
    toEmail: formValue(formData, "toEmail"),
    subject: formValue(formData, "subject"),
    body: formValue(formData, "body"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a carrier email, subject, and rate confirmation message." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Rate confirmation send validated. Connect DATABASE_URL to log and update sends.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      shipper: true,
      carrier: true,
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const rateConfirmation = load.documents[0];
  const blockers = [
    !load.carrier ? "assign a carrier" : null,
    load.carrier?.complianceStatus !== "APPROVED"
      ? "approve carrier compliance"
      : null,
    !load.carrierRate ? "enter the carrier rate" : null,
    !rateConfirmation ? "draft the rate confirmation" : null,
    !load.pickupDate ? "enter the pickup date" : null,
    !load.deliveryDate ? "enter the delivery date" : null,
    !load.originAddress ? "enter the pickup address" : null,
    !load.destinationAddress ? "enter the delivery address" : null,
  ].filter(Boolean);

  if (blockers.length) {
    return Response.json(
      {
        error: `Rate confirmation is not ready to send: ${blockers.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const currentUser = await getCurrentInternalUser();
  const loadLabel = load.loadNumber
    ? `LD-${String(load.loadNumber).padStart(4, "0")}`
    : "LD-????";
  const documentUrl = buildPublicUrl(
    `/api/loads/${load.id}/rate-confirmation/print`,
  );
  const carrierPortalUrl = buildPublicUrl(
    `/carrier-login?next=${encodeURIComponent("/carrier-portal")}`,
  );
  const text = `${input.body.trim()}\n\nReview / print rate confirmation:\n${documentUrl}\n\nSign in to review and sign in the carrier portal:\n${carrierPortalUrl}`;
  const emailResult: SendEmailResult = await sendTransactionalEmail({
    to: input.toEmail,
    subject: input.subject,
    text,
    idempotencyKey: `rate-con-send-${load.id}-${rateConfirmation.id}`,
  }).catch((error) => ({
    sent: false,
    provider: "RESEND" as const,
    message:
      error instanceof Error
        ? `Rate confirmation email failed: ${error.message}`
        : "Rate confirmation email failed.",
  }));
  const now = new Date();
  const providerOutcome = emailResult.sent
    ? `Sent via ${emailResult.provider}${
        emailResult.providerId ? ` (${emailResult.providerId})` : ""
      }`
    : emailResult.message;
  const statusMessage =
    emailResult.sent
      ? `Rate confirmation sent to ${input.toEmail}.`
      : emailResult.provider === "NONE"
        ? `Rate confirmation send validated for ${input.toEmail}, but email provider is not configured.`
        : `Rate confirmation send failed for ${input.toEmail}.`;

  await prisma.$transaction([
    ...(emailResult.sent
      ? [
          prisma.load.update({
            where: { id },
            data: {
              rateConfirmationStatus: "SENT",
              rateConfirmationSentAt: now,
            },
          }),
        ]
      : []),
    prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `${statusMessage} ${providerOutcome}`,
        occurredAt: now,
      },
    }),
    prisma.activity.create({
      data: {
        shipperId: load.shipperId,
        userId: currentUser?.id,
        type: "EMAIL",
        direction: "OUTBOUND",
        subject: input.subject,
        body: text,
        outcome: providerOutcome,
        externalProvider: emailResult.sent ? emailResult.provider : undefined,
        externalMessageId: emailResult.providerId,
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/email");
  revalidatePath("/communications");
  revalidatePath("/dashboard");

  return Response.json(
    {
      message:
        emailResult.sent || emailResult.provider === "NONE"
          ? `${statusMessage} ${emailResult.message}`
          : emailResult.message,
      load: loadLabel,
    },
    { status: emailResult.sent || emailResult.provider === "NONE" ? 200 : 502 },
  );
}
