import { Webhook } from "svix";
import { z } from "zod";

const resendWebhookEventSchema = z.object({
  type: z.string(),
  created_at: z.string().optional(),
  data: z
    .object({
      email_id: z.string().optional(),
      from: z.string().optional(),
      to: z.array(z.string()).optional(),
      subject: z.string().optional(),
      bounce: z
        .object({
          message: z.string().optional(),
          subType: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type ResendWebhookEvent = z.infer<typeof resendWebhookEventSchema>;

export const trackedResendEmailEvents = [
  "email.delivered",
  "email.bounced",
  "email.complained",
] as const;

export function verifyResendWebhookEvent({
  payload,
  headers,
  webhookSecret,
}: {
  payload: string;
  headers: Headers;
  webhookSecret: string;
}) {
  const webhook = new Webhook(webhookSecret);
  const verified = webhook.verify(payload, {
    "svix-id": headers.get("svix-id") ?? "",
    "svix-timestamp": headers.get("svix-timestamp") ?? "",
    "svix-signature": headers.get("svix-signature") ?? "",
  });
  const parsed = resendWebhookEventSchema.safeParse(verified);

  if (!parsed.success) {
    throw new Error("Unsupported Resend webhook payload.");
  }

  return parsed.data;
}

export function isTrackedResendEmailEvent(type: string) {
  return trackedResendEmailEvents.includes(
    type as (typeof trackedResendEmailEvents)[number],
  );
}

export function getResendEventOutcome(event: ResendWebhookEvent) {
  if (event.type === "email.delivered") {
    return "Delivered by Resend.";
  }

  if (event.type === "email.complained") {
    return "Spam complaint received by Resend.";
  }

  if (event.type === "email.bounced") {
    const bounce = event.data?.bounce;
    return [
      "Bounced by Resend.",
      bounce?.type ? `Type: ${bounce.type}.` : null,
      bounce?.subType ? `Subtype: ${bounce.subType}.` : null,
      bounce?.message ? `Reason: ${bounce.message}` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return `Resend event received: ${event.type}.`;
}

export function getResendEventSubject(event: ResendWebhookEvent) {
  if (event.type === "email.delivered") {
    return "Quote email delivered";
  }

  if (event.type === "email.complained") {
    return "Quote email spam complaint";
  }

  if (event.type === "email.bounced") {
    return "Quote email bounced";
  }

  return "Quote email event";
}

export function getResendEventBody(event: ResendWebhookEvent) {
  const recipients = event.data?.to?.join(", ") || "Unknown recipient";
  const subject = event.data?.subject ?? "No subject";
  const createdAt = event.created_at ?? event.data?.email_id ?? "Unknown time";

  return [
    `Event: ${event.type}`,
    `Email ID: ${event.data?.email_id ?? "Unknown"}`,
    `To: ${recipients}`,
    `Subject: ${subject}`,
    `Received: ${createdAt}`,
  ].join("\n");
}
