import { guardInternalRole } from "@/lib/current-user";
import { buildOutboundCallTwiml } from "@/lib/twilio-voice";

export async function POST(request: Request) {
  const guard = await guardInternalRole(
    ["OWNER", "ADMIN", "OPS", "SALES"],
    "You do not have permission to initiate outbound calls.",
  );
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId") ?? "unpersisted-call";

  return buildOutboundCallTwiml(callId);
}
