import type { EmailSuppressionReason } from "@prisma/client";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import type { ResendWebhookEvent } from "@/lib/resend-webhooks";

export type EmailSuppressionStatus = {
  suppressed: boolean;
  email: string;
  reason?: EmailSuppressionReason;
  notes?: string | null;
};

export function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

export async function getEmailSuppressionStatus(
  email: string,
): Promise<EmailSuppressionStatus> {
  const normalized = normalizeEmailAddress(email);

  if (!normalized || !hasDatabaseUrl() || !prisma) {
    return {
      suppressed: false,
      email: normalized,
    };
  }

  const suppression = await prisma.emailSuppression.findUnique({
    where: { email: normalized },
  });

  if (!suppression) {
    return {
      suppressed: false,
      email: normalized,
    };
  }

  return {
    suppressed: true,
    email: normalized,
    reason: suppression.reason,
    notes: suppression.notes,
  };
}

export async function upsertEmailSuppressionFromResendEvent(
  event: ResendWebhookEvent,
  eventId: string,
) {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  const reason = getSuppressionReasonFromResendEvent(event);
  const recipient = event.data?.to?.[0];

  if (!reason || !recipient) {
    return null;
  }

  const normalized = normalizeEmailAddress(recipient);
  const notes =
    reason === "COMPLAINED"
      ? "Suppressed after Resend spam complaint."
      : "Suppressed after Resend bounce.";

  return prisma.emailSuppression.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      reason,
      sourceProvider: "RESEND",
      sourceEventId: eventId,
      messageId: event.data?.email_id,
      notes,
      lastEventAt: new Date(),
    },
    update: {
      reason,
      sourceProvider: "RESEND",
      sourceEventId: eventId,
      messageId: event.data?.email_id,
      notes,
      lastEventAt: new Date(),
    },
  });
}

function getSuppressionReasonFromResendEvent(
  event: ResendWebhookEvent,
): EmailSuppressionReason | null {
  if (event.type === "email.complained") {
    return "COMPLAINED";
  }

  if (event.type === "email.bounced") {
    return "BOUNCED";
  }

  return null;
}
