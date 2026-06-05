import OpenAI from "openai";

import type { FreightAuditInput, QuoteRequestInput } from "@/lib/validation";

type AgentResult = {
  summary: string;
  confidence: number;
  nextAction: string;
};

export type CallIntakeAgentResult = AgentResult & {
  quoteRequest: Record<string, string | number | boolean>;
  missingQuestions: string[];
};

export type BrokerageAgentName =
  | "Sales Follow-Up Agent"
  | "Quote Pricing Agent"
  | "Carrier Coverage Agent"
  | "Load Tracking Agent"
  | "Billing Readiness Agent"
  | "Carrier Compliance Agent";

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

export async function runBrokerageAgent(input: {
  agentName: BrokerageAgentName;
  relatedEntityType: string;
  context: unknown;
}): Promise<AgentResult> {
  const instructions = getAgentInstructions(input.agentName);

  if (!client) {
    return {
      summary: `${input.agentName} reviewed this ${input.relatedEntityType}. Grok is not configured yet, so this is a local placeholder based on the current CRM/TMS record.`,
      confidence: 0.5,
      nextAction: instructions.placeholderNextAction,
    };
  }

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
}

function getAgentInstructions(agentName: BrokerageAgentName) {
  const templates: Record<
    BrokerageAgentName,
    { systemPrompt: string; task: string; placeholderNextAction: string }
  > = {
    "Sales Follow-Up Agent": {
      systemPrompt:
        "You are a freight brokerage sales manager helping a broker decide the next best human follow-up.",
      task:
        "Review the lead record and recommend the best next call, email, or qualification action.",
      placeholderNextAction:
        "Call the contact, confirm lane volume and service pain, then schedule the next follow-up.",
    },
    "Quote Pricing Agent": {
      systemPrompt:
        "You are a freight brokerage pricing analyst reviewing shipper quote details before the broker gives a rate.",
      task:
        "Review the quote request, identify missing pricing facts, and recommend the next pricing action.",
      placeholderNextAction:
        "Confirm service requirements, estimate target buy rate, then record a customer quote.",
    },
    "Carrier Coverage Agent": {
      systemPrompt:
        "You are a carrier sales and coverage coordinator evaluating carrier options for a load.",
      task:
        "Review the load and carrier offers, then recommend the strongest compliant coverage path.",
      placeholderNextAction:
        "Prioritize approved carriers, compare margin, and accept the best compliant offer.",
    },
    "Load Tracking Agent": {
      systemPrompt:
        "You are a freight operations coordinator watching active load execution and customer update needs.",
      task:
        "Review load status, events, documents, and risk notes, then recommend the next tracking action.",
      placeholderNextAction:
        "Call or text dispatch for the next status update, then log a shipment event.",
    },
    "Billing Readiness Agent": {
      systemPrompt:
        "You are a freight brokerage billing coordinator checking POD and invoice readiness.",
      task:
        "Review load documents, POD state, invoice state, and margin, then recommend the next billing action.",
      placeholderNextAction:
        "Collect POD if missing; otherwise create or send the invoice and log the billing status.",
    },
    "Carrier Compliance Agent": {
      systemPrompt:
        "You are a carrier compliance coordinator checking whether a carrier can be safely used.",
      task:
        "Review carrier compliance, identifiers, contact details, lanes, and related load context, then recommend the next compliance action.",
      placeholderNextAction:
        "Verify authority, insurance, MC/DOT details, and only tender once compliance is approved.",
    },
  };

  return templates[agentName];
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
