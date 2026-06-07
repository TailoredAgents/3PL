import OpenAI from "openai";

import type { BrokerageAgentName } from "@/lib/agent-config";
import { getAgentPromptTemplate } from "@/lib/settings";
import type { AgentPromptTemplateView } from "@/lib/settings";
import type { FreightAuditInput, QuoteRequestInput } from "@/lib/validation";
import { logIntegration } from "@/lib/integrations/logging";

type AgentResult = {
  summary: string;
  confidence: number;
  nextAction: string;
};

export type CommunicationDraftResult = AgentResult & {
  subject: string;
  body: string;
};

export type CallIntakeAgentResult = AgentResult & {
  quoteRequest: Record<string, string | number | boolean>;
  missingQuestions: string[];
};

const xaiApiKey = process.env.XAI_API_KEY;
const xaiModel = process.env.XAI_MODEL ?? "grok-4.3";

const client = xaiApiKey
  ? new OpenAI({
      apiKey: xaiApiKey,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

async function withLoggedXai<T>(action: string, fn: () => Promise<T>, extra?: { loadId?: string; message?: string }): Promise<T> {
  try {
    const result = await fn();
    await logIntegration({
      provider: "XAI",
      action,
      status: "SUCCESS",
      loadId: extra?.loadId ?? null,
      message: extra?.message ?? "xAI completion succeeded",
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await logIntegration({
      provider: "XAI",
      action,
      status: "FAILED",
      loadId: extra?.loadId ?? null,
      error: message,
    });
    throw err;
  }
}

export async function runSavingsAuditAgent(
  input: FreightAuditInput,
): Promise<AgentResult> {
  if (!client) {
    return {
      summary: `Audit received for ${input.companyName}. Grok is not configured yet, so this is a local placeholder. Once XAI_API_KEY is set, the agent will extract lane, equipment, accessorial, and rate-per-mile patterns from the uploaded documents.`,
      confidence: 0.5,
      nextAction:
        "Create CRM lead, review uploaded invoices, and call the shipper within one business hour.",
    };
  }

  return withLoggedXai(
    "AGENT_RUN",
    async () => {
      const response = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a senior freight brokerage analyst. Return concise JSON with summary, confidence, and nextAction. Do not invent exact savings when documents have not been OCR processed.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create an initial freight savings audit intake summary.",
              input,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });
      return parseAgentResponse(response.choices[0]?.message?.content);
    },
    { message: `Savings audit for ${input.companyName}` },
  );
}

export async function runQuoteStructuringAgent(
  input: QuoteRequestInput,
): Promise<AgentResult> {
  if (!client) {
    return {
      summary: `Quote request received for ${input.origin} to ${input.destination}. Grok is not configured yet, so this is a local placeholder.`,
      confidence: 0.5,
      nextAction:
        "Validate pickup requirements, price the lane, then request carrier coverage.",
    };
  }

  return withLoggedXai(
    "AGENT_RUN",
    async () => {
      const response = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a freight brokerage quote intake agent. Return concise JSON with summary, confidence, and nextAction.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Structure this shipper quote request for pricing.",
              input,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });
      return parseAgentResponse(response.choices[0]?.message?.content);
    },
    { message: `Quote structuring ${input.origin} → ${input.destination}` },
  );
}

export async function runBrokerageAgent(input: {
  agentName: BrokerageAgentName;
  relatedEntityType: string;
  context: unknown;
  instructions?: AgentPromptTemplateView;
}): Promise<AgentResult> {
  const instructions =
    input.instructions ?? (await getAgentPromptTemplate(input.agentName));

  if (!client) {
    return {
      summary: `${input.agentName} reviewed this ${input.relatedEntityType}. Grok is not configured yet, so this is a local placeholder based on the current CRM/TMS record.`,
      confidence: 0.5,
      nextAction: instructions.placeholderNextAction,
    };
  }

  return withLoggedXai(
    "AGENT_RUN",
    async () => {
      const response = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          {
            role: "system",
            content: `${instructions.systemPrompt} Return concise JSON with summary, confidence, and nextAction. Keep recommendations operational and do not claim that any customer, carrier, or marketplace action has already been performed.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              task: instructions.task,
              relatedEntityType: input.relatedEntityType,
              context: input.context,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });
      return parseAgentResponse(response.choices[0]?.message?.content);
    },
    { message: `Brokerage agent ${input.agentName} for ${input.relatedEntityType}` },
  );
}

export async function runCommunicationDraftAgent(input: {
  channel: "email" | "sms";
  purpose: string;
  context: unknown;
  instructions: AgentPromptTemplateView;
}): Promise<CommunicationDraftResult> {
  if (!client) {
    const contact = extractDraftContact(input.context);
    const subject =
      input.channel === "email"
        ? `Following up with ${contact.company}`
        : "SMS follow-up";
    const body =
      input.channel === "email"
        ? [
            `Hi ${contact.contactName},`,
            "",
            "I wanted to follow up on your freight needs and see what lanes or shipments you would like us to help price next.",
            "",
            "Thanks,",
          ].join("\n")
        : `Hi ${contact.contactName}, this is DAO Logistics following up on your freight needs. Do you have any lanes or shipments we can help price today?`;

    return {
      subject,
      body,
      summary:
        "Draft created locally because Grok is not configured. Review before sending.",
      confidence: 0.45,
      nextAction: "Review the draft, edit as needed, then send manually.",
    };
  }

  return withLoggedXai(
    "AGENT_RUN",
    async () => {
      const response = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          {
            role: "system",
            content:
              `${input.instructions.systemPrompt} Draft customer-facing ${input.channel.toUpperCase()} copy only. ` +
              "Return JSON with subject, body, summary, confidence, and nextAction. " +
              "Do not claim a rate, truck, booking, dispatch, or customer action has already happened. " +
              "Use only facts present in the provided context. Keep SMS under 320 characters.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: input.instructions.task,
              draftPurpose: input.purpose,
              channel: input.channel,
              context: input.context,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });

      return parseCommunicationDraftResponse(
        response.choices[0]?.message?.content,
        input.channel,
      );
    },
    { message: `Communication ${input.channel} draft (${input.purpose})` },
  );
}

export async function runCallIntakeAgent(input: {
  transcriptText: string;
  context: unknown;
}): Promise<CallIntakeAgentResult> {
  if (!client) {
    return {
      summary:
        "Call transcript reviewed locally. Grok is not configured yet, so this is a placeholder extraction.",
      confidence: 0.4,
      nextAction:
        "Review the transcript, fill any missing lane details, then create a quote request.",
      quoteRequest: {
        companyName: "",
        contactName: "",
        originCity: "",
        originState: "",
        destinationCity: "",
        destinationState: "",
        equipmentType: "",
        intakeChannel: "PHONE",
      },
      missingQuestions: [
        "Confirm origin and destination.",
        "Confirm equipment, pickup window, commodity, and weight.",
      ],
    };
  }

  return withLoggedXai(
    "AGENT_RUN",
    async () => {
      const response = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a freight brokerage phone intake agent. Extract only facts supported by the transcript or CRM context. Return concise JSON with summary, confidence, nextAction, quoteRequest, and missingQuestions. quoteRequest should use field names from the internal quote request form: companyName, contactName, email, phone, originCity, originState, originAddress, destinationCity, destinationState, destinationAddress, pickupDate, pickupWindow, deliveryDate, deliveryWindow, equipmentType, commodity, weight, palletCount, pieceCount, dimensions, hazmat, temperatureRequirement, appointmentRequired, accessorials, customerReference, urgency, targetMarginPercent, pricingNotes, specialRequirements, intakeChannel, quotedByPhone.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Extract a quote request draft from this call transcript.",
              transcriptText: input.transcriptText,
              context: input.context,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });
      return parseCallIntakeResponse(response.choices[0]?.message?.content);
    },
    { message: "Call intake transcript processing" },
  );
}

function parseAgentResponse(content: string | null | undefined): AgentResult {
  if (!content) {
    return {
      summary: "Agent completed without a usable summary.",
      confidence: 0.25,
      nextAction: "Review manually.",
    };
  }

  try {
    const parsed = JSON.parse(content) as Partial<AgentResult>;
    return {
      summary: parsed.summary ?? "Agent summary unavailable.",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      nextAction: parsed.nextAction ?? "Review manually.",
    };
  } catch {
    return {
      summary: content,
      confidence: 0.5,
      nextAction: "Review manually.",
    };
  }
}

function parseCommunicationDraftResponse(
  content: string | null | undefined,
  channel: "email" | "sms",
): CommunicationDraftResult {
  if (!content) {
    return {
      subject: channel === "email" ? "Freight follow-up" : "SMS follow-up",
      body: "",
      summary: "Draft agent completed without usable copy.",
      confidence: 0.25,
      nextAction: "Write the message manually before sending.",
    };
  }

  try {
    const parsed = JSON.parse(content) as Partial<CommunicationDraftResult>;
    return {
      subject:
        typeof parsed.subject === "string" && parsed.subject.trim()
          ? parsed.subject.trim()
          : channel === "email"
            ? "Freight follow-up"
            : "SMS follow-up",
      body: typeof parsed.body === "string" ? parsed.body.trim() : "",
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "Communication draft created.",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      nextAction:
        typeof parsed.nextAction === "string"
          ? parsed.nextAction
          : "Review, edit, and send manually.",
    };
  } catch {
    return {
      subject: channel === "email" ? "Freight follow-up" : "SMS follow-up",
      body: content,
      summary: "Communication draft created from unstructured model output.",
      confidence: 0.45,
      nextAction: "Review, edit, and send manually.",
    };
  }
}

function extractDraftContact(context: unknown) {
  if (!context || typeof context !== "object") {
    return { company: "this customer", contactName: "there" };
  }

  const maybeContext = context as {
    company?: unknown;
    contactName?: unknown;
  };

  return {
    company:
      typeof maybeContext.company === "string"
        ? maybeContext.company
        : "this customer",
    contactName:
      typeof maybeContext.contactName === "string" &&
      maybeContext.contactName !== "No contact"
        ? maybeContext.contactName
        : "there",
  };
}

function parseCallIntakeResponse(
  content: string | null | undefined,
): CallIntakeAgentResult {
  const fallback: CallIntakeAgentResult = {
    summary: "Call intake output unavailable.",
    confidence: 0.25,
    nextAction: "Review manually.",
    quoteRequest: {},
    missingQuestions: ["Review transcript manually."],
  };

  if (!content) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(content) as Partial<CallIntakeAgentResult>;
    return {
      summary: parsed.summary ?? fallback.summary,
      confidence:
        typeof parsed.confidence === "number"
          ? parsed.confidence
          : fallback.confidence,
      nextAction: parsed.nextAction ?? fallback.nextAction,
      quoteRequest:
        parsed.quoteRequest && typeof parsed.quoteRequest === "object"
          ? parsed.quoteRequest
          : {},
      missingQuestions: Array.isArray(parsed.missingQuestions)
        ? parsed.missingQuestions.map(String)
        : fallback.missingQuestions,
    };
  } catch {
    return {
      ...fallback,
      summary: content,
    };
  }
}

export type DocumentStructuredFields = {
  bolNumber?: string | null;
  proNumber?: string | null;
  pieces?: number | null;
  weightLbs?: number | null;
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  shipDate?: string | null;
  deliveryDate?: string | null;
  commodity?: string | null;
  rate?: number | null;
  carrierName?: string | null;
  customerReference?: string | null;
  exceptions?: string[];
  notes?: string | null;
};

export async function runDocumentStructuredExtraction(input: {
  documentType: string;
  extractedText?: string | null;
  fileName: string;
  mimeType?: string | null;
  imageBase64?: string | null; // full data URL preferred for vision
}): Promise<{
  fields: DocumentStructuredFields;
  confidence: number;
  summary: string;
}> {
  if (!client) {
    return {
      fields: {},
      confidence: 0.25,
      summary: "Structured extraction is a local placeholder (no XAI_API_KEY). Configure credentials for vision + JSON field extraction on PDFs and images.",
    };
  }

  const isImage = !!input.imageBase64 &&
    (input.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(input.fileName));

  const system = `You are a precise freight brokerage document parser.
Only extract information that is explicitly visible or stated.
Return strict JSON with:
{
  "fields": {
    "bolNumber": string|null,
    "proNumber": string|null,
    "pieces": number|null,
    "weightLbs": number|null,
    "originCity": string|null,
    "originState": string|null,
    "destinationCity": string|null,
    "destinationState": string|null,
    "shipDate": string|null,
    "deliveryDate": string|null,
    "commodity": string|null,
    "rate": number|null,
    "carrierName": string|null,
    "customerReference": string|null
  },
  "confidence": number (0-1),
  "summary": string (one sentence),
  "exceptions": string[] (e.g. ["Pieces on document do not match load", "Missing BOL number"])
}`;

  const baseText = `Document Type: ${input.documentType}
File: ${input.fileName}
Raw extracted text (may be incomplete or empty):
${input.extractedText || "(no prior text extraction)"}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userContent: any = baseText;

  if (isImage && input.imageBase64) {
    const imageUrl = input.imageBase64.startsWith("data:")
      ? input.imageBase64
      : `data:${input.mimeType || "image/jpeg"};base64,${input.imageBase64}`;
    userContent = [
      { type: "text", text: baseText + "\n\nAnalyze the attached image of the freight document and extract the structured fields accurately." },
      { type: "image_url", image_url: { url: imageUrl } }
    ];
  }

  try {
    const response = await client.chat.completions.create({
      model: xaiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 900,
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = raw ? JSON.parse(raw) : {};

    await logIntegration({
      provider: "XAI",
      action: "DOCUMENT_EXTRACTION",
      status: "SUCCESS",
      message: `Document structured extraction (${input.documentType})`,
    });

    return {
      fields: parsed.fields || {},
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.6,
      summary: parsed.summary || "Structured fields extracted from document.",
    };
  } catch (err) {
    await logIntegration({
      provider: "XAI",
      action: "DOCUMENT_EXTRACTION",
      status: "FAILED",
      error: err instanceof Error ? err.message : "unknown",
    });
    return {
      fields: {},
      confidence: 0.2,
      summary: `Structured extraction encountered an error: ${err instanceof Error ? err.message : "unknown"}. Review raw text manually.`,
    };
  }
}
