import { revalidatePath } from "next/cache";

import { formValue, safeFormData } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { twimlResponse, say, hangup } from "@/lib/twilio-voice";

export async function POST(
  request: Request,
) {
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
  const recordingSid = formValue(formData, "RecordingSid");
  const recordingUrl = formValue(formData, "RecordingUrl");
  const recordingStatus = formValue(formData, "RecordingStatus");
  const duration = formValue(formData, "RecordingDuration");

  if (hasDatabaseUrl() && prisma) {
    const where = callId
      ? { id: callId }
      : callSid
        ? { twilioCallSid: callSid }
        : null;

    if (where) {
      const updated = await prisma.brokerageCall.update({
        where,
        data: {
          status:
            recordingStatus === "completed" ? "COMPLETED" : "IN_PROGRESS",
          recordingSid,
          recordingUrl,
          recordingDuration: duration ? Number(duration) : null,
          recordingStatus:
            recordingStatus === "completed"
              ? "COMPLETED"
              : recordingStatus === "absent"
                ? "ABSENT"
                : recordingStatus === "failed"
                  ? "FAILED"
                  : "IN_PROGRESS",
        },
      });

      revalidatePath("/calls");
      revalidatePath(`/calls/${updated.id}`);
    }
  }

  return twimlResponse([say("Thank you. We have your call details."), hangup()].join(""));
}
