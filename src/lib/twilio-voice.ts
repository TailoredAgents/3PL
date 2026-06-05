import { getAppSettings } from "@/lib/settings";

export function twimlResponse(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export function say(message: string) {
  return `<Say>${escapeXml(message)}</Say>`;
}

export function hangup() {
  return "<Hangup/>";
}

export function buildPublicUrl(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${baseUrl}${path}`;
}

export async function buildInboundCallTwiml(callId: string) {
  const settings = await getAppSettings();
  const recordingCallback = buildPublicUrl(
    `/api/twilio/voice/recording?callId=${encodeURIComponent(callId)}`,
  );
  const transcriptionCallback = buildPublicUrl(
    `/api/twilio/voice/transcription?callId=${encodeURIComponent(callId)}`,
  );
  const forwardTo = process.env.TWILIO_FORWARD_TO_PHONE_NUMBER;

  if (forwardTo) {
    return twimlResponse(
      [
        say(settings.callRecordingDisclosure),
        `<Dial record="record-from-answer-dual" recordingStatusCallback="${escapeAttribute(
          recordingCallback,
        )}" recordingStatusCallbackMethod="POST">${escapeXml(forwardTo)}</Dial>`,
      ].join(""),
    );
  }

  return twimlResponse(
    [
      say(settings.callRecordingDisclosure),
      say("Please leave the shipment details after the tone. A broker will follow up shortly."),
      `<Record timeout="8" maxLength="1800" recordingStatusCallback="${escapeAttribute(
        recordingCallback,
      )}" recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed absent" transcribe="true" transcribeCallback="${escapeAttribute(
        transcriptionCallback,
      )}" />`,
      say("Thank you. We received your shipment details."),
      hangup(),
    ].join(""),
  );
}

export async function buildOutboundCallTwiml(callId: string) {
  const settings = await getAppSettings();
  const forwardTo = process.env.TWILIO_FORWARD_TO_PHONE_NUMBER;
  const recordingCallback = buildPublicUrl(
    `/api/twilio/voice/recording?callId=${encodeURIComponent(callId)}`,
  );

  if (!forwardTo) {
    return twimlResponse(
      [
        say("A broker is not available to connect this call right now."),
        hangup(),
      ].join(""),
    );
  }

  return twimlResponse(
    [
      say(settings.callRecordingDisclosure),
      `<Dial record="record-from-answer-dual" recordingStatusCallback="${escapeAttribute(
        recordingCallback,
      )}" recordingStatusCallbackMethod="POST">${escapeXml(forwardTo)}</Dial>`,
    ].join(""),
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeXml(value).replace(/"/g, "&quot;");
}
