import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import type { BrokerageAgentName } from "@/lib/agent-config";
import {
  getAgentAutomationPolicy,
  getEffectiveAgentRunStatus,
} from "@/lib/agent-control";
import { runCommunicationDraftAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  getAgentMode,
  getAgentPromptTemplate,
} from "@/lib/settings";
import type { CommunicationDraftInput } from "@/lib/validation";

export type CommunicationDraftView = {
  channel: CommunicationDraftInput["channel"];
  purpose: CommunicationDraftInput["purpose"];
  subject: string;
  body: string;
  summary: string;
  confidence: number;
  nextAction: string;
  runId?: string;
};

export async function createCommunicationDraft(
  leadId: string,
  input: CommunicationDraftInput,
): Promise<CommunicationDraftView> {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      shipper: {
        include: {
          quoteRequests: {
            include: {
              customerQuotes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      contact: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const agentName = getDraftAgentName(input.purpose);
  const mode = await getAgentMode(agentName);
  const policy = getAgentAutomationPolicy(agentName);
  const runStatus = getEffectiveAgentRunStatus({ mode, policy });
  const instructions = await getAgentPromptTemplate(agentName);
  const context = {
    company: lead.shipper.companyName,
    contactName: formatContactName(lead.contact),
    contactTitle: lead.contact?.title ?? null,
    email: lead.contact?.email ?? null,
    phone: lead.contact?.phone ?? null,
    leadStage: lead.stage,
    priority: lead.priority,
    nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
    shipperNotes: lead.shipper.notes,
    leadNotes: lead.notes,
    recentActivities: lead.activities.map((activity) => ({
      type: activity.type,
      direction: activity.direction,
      subject: activity.subject,
      body: activity.body,
      outcome: activity.outcome,
      createdAt: activity.createdAt.toISOString(),
    })),
    recentQuoteRequests: lead.shipper.quoteRequests.map((quote) => ({
      id: quote.id,
      status: quote.status,
      lane: `${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState}`,
      equipmentType: quote.equipmentType,
      pickupDate: quote.pickupDate?.toISOString() ?? null,
      latestQuotedRate: quote.customerQuotes[0]?.quotedRate
        ? Number(quote.customerQuotes[0].quotedRate)
        : null,
      latestQuoteStatus: quote.customerQuotes[0]?.status ?? null,
    })),
  };
  const draft = await runCommunicationDraftAgent({
    channel: input.channel,
    purpose: input.purpose,
    context,
    instructions,
  });
  const run = await prisma.aiAgentRun.create({
    data: {
      agentName,
      relatedEntityType: "Lead",
      relatedEntityId: lead.id,
      status: runStatus,
      prompt: `Template: ${agentName} v${instructions.version}`,
      inputJson: {
        requestedAt: new Date().toISOString(),
        channel: input.channel,
        purpose: input.purpose,
        automationMode: mode,
        riskLevel: policy.riskLevel,
        approvalRequired: policy.approvalRequired,
        gatedActions: policy.gatedActions,
        context: context as Prisma.InputJsonValue,
      },
      outputJson: {
        ...draft,
        channel: input.channel,
        purpose: input.purpose,
      },
      confidence: draft.confidence,
      automationMode: mode,
      riskLevel: policy.riskLevel,
      approvalRequired: policy.approvalRequired,
      actionSummary: `Drafted ${input.channel.toUpperCase()} copy for ${formatDraftPurpose(input.purpose)}. No message was sent.`,
      promptVersion: instructions.version,
      promptSnapshot: {
        agentName: instructions.agentName,
        version: instructions.version,
        systemPrompt: instructions.systemPrompt,
        task: instructions.task,
        placeholderNextAction: instructions.placeholderNextAction,
      },
      controlJson: {
        channel: input.channel,
        purpose: input.purpose,
        gatedActions: policy.gatedActions,
        approvalGate:
          "Draft only. Human must edit and use the send form before any customer contact.",
      },
    },
  });

  revalidatePath("/communications");
  revalidatePath("/agents");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${lead.id}`);

  return {
    channel: input.channel,
    purpose: input.purpose,
    subject: draft.subject,
    body: draft.body,
    summary: draft.summary,
    confidence: draft.confidence,
    nextAction: draft.nextAction,
    runId: run.id,
  };
}

function getDraftAgentName(
  purpose: CommunicationDraftInput["purpose"],
): BrokerageAgentName {
  return purpose === "quote_follow_up"
    ? "Quote Pricing Agent"
    : "Sales Follow-Up Agent";
}

function formatContactName(
  contact: { firstName: string; lastName?: string | null } | null,
) {
  if (!contact) {
    return "No contact";
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

function formatDraftPurpose(purpose: CommunicationDraftInput["purpose"]) {
  return purpose.replaceAll("_", " ");
}
