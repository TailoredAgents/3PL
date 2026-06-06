import { prisma } from "@/lib/prisma";
import { getEmailSuppressionStatus } from "@/lib/email-suppression";
import type { SendEmailResult } from "@/lib/email";
import { sendTransactionalEmail } from "@/lib/email";
import {
  createTwilioCall,
  getTwilioConfig,
  sendTwilioSms,
} from "@/lib/twilio-client";
import { buildPublicUrl } from "@/lib/twilio-voice";

export async function startLeadClickToCall(input: {
  leadId: string;
  toPhone: string;
  note?: string;
}) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const lead = await getLeadForOutreach(input.leadId);
  const config = getTwilioConfig();

  if (!config.configured || !config.fromPhone || !config.forwardToPhone) {
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        shipperId: lead.shipperId,
        contactId: lead.contactId,
        type: "CALL",
        direction: "OUTBOUND",
        subject: "Click-to-call validated",
        body: input.note ?? `Call requested to ${input.toPhone}.`,
        outcome:
          "Twilio calling is not fully configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and TWILIO_FORWARD_TO_PHONE_NUMBER.",
      },
    });

    return {
      message:
        "Call logged. Configure Twilio credentials and forwarding number to place calls.",
    };
  }

  const call = await prisma.brokerageCall.create({
    data: {
      direction: "OUTBOUND",
      status: "IN_PROGRESS",
      fromPhone: config.fromPhone,
      toPhone: input.toPhone,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      recordingStatus: "IN_PROGRESS",
      transcriptStatus: "NOT_REQUESTED",
      callerName: formatContactName(lead.contact),
    },
  });
  const callbackUrl = buildPublicUrl(
    `/api/twilio/voice/outbound/status?callId=${encodeURIComponent(call.id)}`,
  );
  const result = await createTwilioCall({
    to: input.toPhone,
    from: config.fromPhone,
    url: buildPublicUrl(
      `/api/twilio/voice/outbound?callId=${encodeURIComponent(call.id)}`,
    ),
    statusCallback: callbackUrl,
  });

  await prisma.$transaction([
    prisma.brokerageCall.update({
      where: { id: call.id },
      data: {
        twilioCallSid: result.sid || call.twilioCallSid,
        status: result.status === "failed" ? "FAILED" : "IN_PROGRESS",
      },
    }),
    prisma.activity.create({
      data: {
        leadId: lead.id,
        shipperId: lead.shipperId,
        contactId: lead.contactId,
        type: "CALL",
        direction: "OUTBOUND",
        subject: "Outbound click-to-call started",
        body:
          input.note ??
          `Outbound call started to ${formatContactName(lead.contact)} at ${input.toPhone}.`,
        outcome: `Twilio call ${result.sid || "queued"} (${result.status}).`,
      },
    }),
  ]);

  return { message: "Outbound call started." };
}

export async function sendLeadSms(input: {
  leadId: string;
  toPhone: string;
  message: string;
}) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const lead = await getLeadForOutreach(input.leadId);
  const config = getTwilioConfig();

  if (!config.configured || !config.fromPhone) {
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        shipperId: lead.shipperId,
        contactId: lead.contactId,
        type: "SMS",
        direction: "OUTBOUND",
        subject: "SMS validated",
        body: input.message,
        outcome:
          "Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
    });

    return {
      message: "SMS logged. Configure Twilio credentials to send messages.",
    };
  }

  const result = await sendTwilioSms({
    to: input.toPhone,
    from: config.fromPhone,
    body: input.message,
  });

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      type: "SMS",
      direction: "OUTBOUND",
      subject: "Outbound SMS sent",
      body: input.message,
      outcome: `Twilio message ${result.sid || "queued"} (${result.status}).`,
    },
  });

  return { message: "SMS sent and logged." };
}

export async function sendLeadEmail(input: {
  leadId: string;
  toEmail: string;
  subject: string;
  body: string;
  userId?: string;
}) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const lead = await getLeadForOutreach(input.leadId);
  const suppression = await getEmailSuppressionStatus(input.toEmail);

  if (suppression.suppressed) {
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        shipperId: lead.shipperId,
        contactId: lead.contactId,
        userId: input.userId,
        type: "EMAIL",
        direction: "INTERNAL",
        subject: `Suppressed email to ${suppression.email}`,
        body: input.body,
        outcome: `Blocked before send because ${suppression.email} is suppressed after ${suppression.reason?.toLowerCase()}.`,
      },
    });

    throw new Error(
      `Email blocked. ${suppression.email} is suppressed after ${suppression.reason?.toLowerCase()}. Use a different customer email before sending.`,
    );
  }

  const result: SendEmailResult = await sendTransactionalEmail({
    to: input.toEmail,
    subject: input.subject,
    text: input.body,
    idempotencyKey: `lead-email-${input.leadId}-${input.toEmail}-${input.subject}`,
  }).catch((error) => ({
    sent: false,
    provider: "RESEND" as const,
    message:
      error instanceof Error
        ? `Email failed: ${error.message}`
        : "Email failed.",
  }));

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      userId: input.userId,
      type: "EMAIL",
      direction: "OUTBOUND",
      subject: input.subject,
      body: input.body,
      outcome: result.sent
        ? `Sent via ${result.provider}${
            result.providerId ? ` (${result.providerId})` : ""
          }`
        : result.message,
      externalProvider: result.sent ? result.provider : undefined,
      externalMessageId: result.providerId,
    },
  });

  return { message: result.message };
}

async function getLeadForOutreach(leadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      contact: true,
      shipper: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  return lead;
}

function formatContactName(contact: {
  firstName: string;
  lastName?: string | null;
} | null) {
  if (!contact) {
    return "contact";
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}
