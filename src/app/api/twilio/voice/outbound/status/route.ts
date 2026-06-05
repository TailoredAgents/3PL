import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const formData = await request.formData();
  const callSid = formValue(formData, "CallSid");
  const callStatus = formValue(formData, "CallStatus");

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Call status received." });
  }

  const where = callId
    ? { id: callId }
    : callSid
      ? { twilioCallSid: callSid }
      : null;

  if (!where) {
    return Response.json({ message: "No call matched." });
  }

  const updated = await prisma.brokerageCall.update({
    where,
    data: {
      twilioCallSid: callSid,
      status:
        callStatus === "completed"
          ? "COMPLETED"
          : callStatus === "failed" ||
              callStatus === "busy" ||
              callStatus === "no-answer" ||
              callStatus === "canceled"
            ? "FAILED"
            : "IN_PROGRESS",
    },
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${updated.id}`);

  return Response.json({ message: "Call status saved." });
}
