import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import {
  brokerageAgentNames,
  type BrokerageAgentName,
} from "@/lib/agent-config";
import {
  getCarrierDetailView,
  getLeadDetailView,
  getLoadDetailView,
  getQuoteRequestDetailView,
} from "@/lib/crm";
import { enrichAgentContext } from "@/lib/agent-enrichment";
import { runBrokerageAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { getAgentMode } from "@/lib/settings";

export type AgentEntityType = "Lead" | "QuoteRequest" | "Load" | "Carrier";

export async function runAndLogBrokerageAgent(input: {
  agentName: BrokerageAgentName;
  relatedEntityType: AgentEntityType;
  relatedEntityId: string;
}) {
  const baseContext = await getAgentEntityContext(
    input.relatedEntityType,
    input.relatedEntityId,
  );

  if (!baseContext) {
    throw new Error("Record not found.");
  }

  const context = await enrichAgentContext(
    input.agentName,
    input.relatedEntityType,
    input.relatedEntityId,
    baseContext,
  );

  const startedAt = new Date();
  const mode = await getAgentMode(input.agentName);
  const runStatus = mode === "autonomous" ? "COMPLETED" : "NEEDS_HUMAN_APPROVAL";

  try {
    const agentResult = await runBrokerageAgent({
      agentName: input.agentName,
      relatedEntityType: input.relatedEntityType,
      context,
    });
    let runId: string | undefined;

    if (hasDatabaseUrl() && prisma) {
      const run = await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: runStatus,
          prompt: `Template: ${input.agentName}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            context: context as Prisma.InputJsonValue,
          },
          outputJson: agentResult,
          confidence: agentResult.confidence,
        },
      });
      runId = run.id;

      await maybeCreateActivity(input, agentResult);
    }

    revalidateAgentEntityPaths(input.relatedEntityType, input.relatedEntityId);

    return { agentResult, runId };
  } catch (error) {
    if (hasDatabaseUrl() && prisma) {
      await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: "FAILED",
          prompt: `Template: ${input.agentName}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            context: context as Prisma.InputJsonValue,
          },
          errorMessage:
            error instanceof Error ? error.message : "Unknown AI agent error.",
        },
      });
    }

    throw error;
  }
}

export async function retryAgentRun(runId: string) {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const run = await prisma.aiAgentRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    throw new Error("Agent run not found.");
  }

  if (run.status !== "FAILED") {
    throw new Error("Only failed agent runs can be retried.");
  }

  if (!isBrokerageAgentName(run.agentName)) {
    throw new Error("Agent run cannot be retried because its agent is unknown.");
  }

  if (!run.relatedEntityType || !run.relatedEntityId) {
    throw new Error("Agent run cannot be retried because it is missing entity context.");
  }

  return runAndLogBrokerageAgent({
    agentName: run.agentName,
    relatedEntityType: run.relatedEntityType as AgentEntityType,
    relatedEntityId: run.relatedEntityId,
  });
}

function isBrokerageAgentName(agentName: string): agentName is BrokerageAgentName {
  return brokerageAgentNames.includes(agentName as BrokerageAgentName);
}

export async function approveAgentRun(runId: string) {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const existing = await prisma.aiAgentRun.findUnique({
    where: { id: runId },
  });

  if (!existing) {
    throw new Error("Agent run not found.");
  }

  if (existing.status !== "NEEDS_HUMAN_APPROVAL") {
    throw new Error("Only agent runs awaiting approval can be approved.");
  }

  const run = await prisma.aiAgentRun.update({
    where: { id: runId },
    data: { status: "COMPLETED" },
  });

  if (run.relatedEntityType && run.relatedEntityId) {
    revalidateAgentEntityPaths(
      run.relatedEntityType as AgentEntityType,
      run.relatedEntityId,
    );
  }

  revalidatePath("/agents");
  revalidatePath("/dashboard");

  return run;
}

export async function getAgentEntityContext(entityType: AgentEntityType, id: string) {
  if (entityType === "Lead") {
    return getLeadDetailView(id);
  }

  if (entityType === "QuoteRequest") {
    return getQuoteRequestDetailView(id);
  }

  if (entityType === "Load") {
    return getLoadDetailView(id);
  }

  if (entityType === "Carrier") {
    return getCarrierDetailView(id);
  }

  return null;
}

export function revalidateAgentEntityPaths(entityType: string, id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/agents");

  if (entityType === "Lead") {
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
  }

  if (entityType === "QuoteRequest") {
    revalidatePath("/quote-requests");
    revalidatePath(`/quote-requests/${id}`);
  }

  if (entityType === "Load") {
    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
  }

  if (entityType === "Carrier") {
    revalidatePath("/carriers");
    revalidatePath(`/carriers/${id}`);
  }
}

async function maybeCreateActivity(
  input: {
    relatedEntityType: string;
    relatedEntityId: string;
    agentName: string;
  },
  agentResult: { summary: string; nextAction: string },
) {
  if (!prisma || input.relatedEntityType !== "Lead") {
    return;
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.relatedEntityId },
    select: {
      id: true,
      shipperId: true,
      contactId: true,
    },
  });

  if (!lead) {
    return;
  }

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      type: "AI_TOUCH",
      direction: "INTERNAL",
      subject: input.agentName,
      body: agentResult.summary,
      outcome: agentResult.nextAction,
    },
  });
}
