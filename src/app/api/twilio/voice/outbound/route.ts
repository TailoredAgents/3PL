import { buildOutboundCallTwiml } from "@/lib/twilio-voice";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId") ?? "unpersisted-call";

  return buildOutboundCallTwiml(callId);
}
