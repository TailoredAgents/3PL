import { revalidatePath } from "next/cache";

import { formValue, safeFormData } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { logIntegration } from "@/lib/integrations/logging";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const formData = await safeFormData(request);
  if (!formData) {
    return Response.json(
      { error: "Expected Twilio form data." },
      { status: 400 },
    );
  }

  const callSid = formValue(formData, "CallSid");
  const transcriptionText = formValue(formData, "TranscriptionText");
  const transcriptionStatus = formValue(formData, "TranscriptionStatus");
  const recordingSid = formValue(formData, "RecordingSid");

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Transcription received." });
  }

  const where = callId
    ? { id: callId }
    : callSid
      ? { twilioCallSid: callSid }
      : null;

  if (!where) {
    return Response.json({ message: "No call matched." });
  }

  const call = await prisma.brokerageCall.update({
    where,
    data: {
      recordingSid,
      transcriptText: transcriptionText,
      transcriptStatus:
        transcriptionStatus === "completed" ? "COMPLETED" : "FAILED",
      extractionStatus: transcriptionText ? "NOT_STARTED" : "FAILED",
    },
  });

  if (call.shipperId && transcriptionText) {
    await prisma.activity.create({
      data: {
        shipperId: call.shipperId,
        contactId: call.contactId,
        type: "CALL",
        direction: "INBOUND",
        subject: "Call transcript received",
        body: transcriptionText,
        outcome: "Ready for AI intake extraction",
      },
    });
  }

  await logIntegration({
    provider: "TWILIO",
    action: "WEBHOOK_RECEIVED",
    status: transcriptionStatus === "completed" ? "SUCCESS" : "FAILED",
    externalId: callSid,
    message: transcriptionText ? "Call transcription received" : "Transcription failed or empty",
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${call.id}`);

  return Response.json({ message: "Transcription saved." });
}
