import { prisma } from "@/lib/prisma";
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
