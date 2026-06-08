export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
};

export type SendEmailResult = {
  sent: boolean;
  provider: "RESEND" | "NONE";
  providerId?: string;
  message: string;
};

export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      sent: false,
      provider: "NONE",
      message:
        "Email validated and logged. Configure RESEND_API_KEY and RESEND_FROM_EMAIL to send.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey
        ? { "Idempotency-Key": input.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html ?? textToHtml(input.text),
      text: input.text,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.message ??
        payload.name ??
        "Resend rejected the email request.",
    );
  }

  return {
    sent: true,
    provider: "RESEND",
    providerId: payload.id,
    message: "Email sent.",
  };
}

function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
