type TwilioCallRequest = {
  to: string;
  from: string;
  url: string;
  statusCallback?: string;
};

type TwilioSmsRequest = {
  to: string;
  from: string;
  body: string;
  statusCallback?: string;
};

export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const forwardToPhone = process.env.TWILIO_FORWARD_TO_PHONE_NUMBER;

  return {
    accountSid,
    authToken,
    fromPhone,
    forwardToPhone,
    configured: Boolean(accountSid && authToken && fromPhone),
    callConfigured: Boolean(accountSid && authToken && fromPhone && forwardToPhone),
  };
}

export async function createTwilioCall(input: TwilioCallRequest) {
  const config = getTwilioConfig();

  if (!config.accountSid || !config.authToken) {
    throw new Error("Twilio account credentials are not configured.");
  }

  return twilioRequest(config.accountSid, config.authToken, "Calls", {
    To: input.to,
    From: input.from,
    Url: input.url,
    Method: "POST",
    ...(input.statusCallback
      ? { StatusCallback: input.statusCallback, StatusCallbackMethod: "POST" }
      : {}),
  });
}

export async function sendTwilioSms(input: TwilioSmsRequest) {
  const config = getTwilioConfig();

  if (!config.accountSid || !config.authToken) {
    throw new Error("Twilio account credentials are not configured.");
  }

  return twilioRequest(config.accountSid, config.authToken, "Messages", {
    To: input.to,
    From: input.from,
    Body: input.body,
    ...(input.statusCallback
      ? { StatusCallback: input.statusCallback, StatusCallbackMethod: "POST" }
      : {}),
  });
}

async function twilioRequest(
  accountSid: string,
  authToken: string,
  resource: "Calls" | "Messages",
  payload: Record<string, string>,
) {
  const body = new URLSearchParams(payload);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/${resource}.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  const result = (await response.json()) as {
    sid?: string;
    status?: string;
    error_message?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      result.error_message ?? result.message ?? `Twilio ${resource} request failed.`,
    );
  }

  return {
    sid: result.sid ?? "",
    status: result.status ?? "queued",
    raw: result,
  };
}
