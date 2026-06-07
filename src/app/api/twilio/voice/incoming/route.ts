import { buildInboundCallTwiml } from "@/lib/twilio-voice";
import { formValue, safeFormData } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { matchCallerByPhone } from "@/lib/calls";
import { logIntegration } from "@/lib/integrations/logging";

export async function POST(request: Request) {
  const formData = await safeFormData(request);
  if (!formData) {
    return Response.json(
      { error: "Expected Twilio form data." },
      { status: 400 },
    );
  }

  const callSid = formValue(formData, "CallSid");
  const fromPhone = formValue(formData, "From");
  const toPhone = formValue(formData, "To");
  const callerName = formValue(formData, "CallerName");

  if (!hasDatabaseUrl() || !prisma) {
    return buildInboundCallTwiml("unpersisted-call");
  }

  const match = await matchCallerByPhone(fromPhone);
  const call = await prisma.brokerageCall.upsert({
    where: { twilioCallSid: callSid ?? `local-${crypto.randomUUID()}` },
    create: {
      direction: "INBOUND",
      status: "IN_PROGRESS",
      twilioCallSid: callSid,
      fromPhone,
      toPhone,
      callerName,
      shipperId: match.shipperId,
      contactId: match.contactId,
      recordingStatus: "IN_PROGRESS",
      transcriptStatus: "PENDING",
    },
    update: {
      status: "IN_PROGRESS",
      fromPhone,
      toPhone,
      callerName,
      shipperId: match.shipperId,
      contactId: match.contactId,
      recordingStatus: "IN_PROGRESS",
    },
  });

  if (match.shipperId) {
    await prisma.activity.create({
      data: {
        shipperId: match.shipperId,
        contactId: match.contactId,
        type: "CALL",
        direction: "INBOUND",
        subject: "Inbound shipment call",
        body: `Inbound call from ${fromPhone ?? "unknown caller"}. Recording/transcription pending.`,
        outcome: "Call intelligence intake started",
      },
    });
  }

  await logIntegration({
    provider: "TWILIO",
    action: "WEBHOOK_RECEIVED",
    status: "SUCCESS",
    externalId: callSid,
    message: `Inbound call from ${fromPhone ?? "unknown"}`,
  });

  return buildInboundCallTwiml(call.id);
}
