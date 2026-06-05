import { revalidatePath } from "next/cache";

import { getCurrentInternalUser } from "@/lib/current-user";
import type { SendEmailResult } from "@/lib/email";
import { sendTransactionalEmail } from "@/lib/email";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { quoteEmailSendSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = quoteEmailSendSchema.safeParse({
    toEmail: formValue(formData, "toEmail"),
    subject: formValue(formData, "subject"),
    body: formValue(formData, "body"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a recipient, subject, and quote email body." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote email validated. Connect DATABASE_URL to log quote emails.",
    });
  }

  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      customerQuotes: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quoteRequest) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const latestQuote = quoteRequest.customerQuotes[0];

  if (!latestQuote) {
    return Response.json(
      { error: "Record a customer quote before sending a quote email." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const currentUser = await getCurrentInternalUser();
  const emailResult: SendEmailResult = await sendTransactionalEmail({
    to: input.toEmail,
    subject: input.subject,
    text: input.body,
    idempotencyKey: `quote-email-${id}-${latestQuote.id}`,
  }).catch((error) => ({
    sent: false,
    provider: "RESEND" as const,
    message:
      error instanceof Error
        ? `Quote email failed: ${error.message}`
        : "Quote email failed.",
  }));

  await prisma.$transaction([
    ...(emailResult.sent
      ? [
          prisma.quoteRequest.update({
            where: { id },
            data: { status: "QUOTED" },
          }),
          prisma.customerQuote.update({
            where: { id: latestQuote.id },
            data: { status: "SENT" },
          }),
        ]
      : []),
    prisma.activity.create({
      data: {
        shipperId: quoteRequest.shipperId,
        contactId: quoteRequest.contactId,
        userId: currentUser?.id,
        type: "EMAIL",
        direction: "OUTBOUND",
        subject: input.subject,
        body: input.body,
        outcome: emailResult.sent
          ? `Sent via ${emailResult.provider}${
              emailResult.providerId ? ` (${emailResult.providerId})` : ""
            }`
          : emailResult.message,
      },
    }),
  ]);

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/dashboard");

  return Response.json(
    { message: emailResult.message },
    { status: emailResult.sent || emailResult.provider === "NONE" ? 200 : 502 },
  );
}
