import OpenAI from "openai";

import type { FreightAuditInput, QuoteRequestInput } from "@/lib/validation";

type AgentResult = {
  summary: string;
  confidence: number;
  nextAction: string;
};

const xaiApiKey = process.env.XAI_API_KEY;
const xaiModel = process.env.XAI_MODEL ?? "grok-4.3";

const client = xaiApiKey
  ? new OpenAI({
      apiKey: xaiApiKey,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

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
