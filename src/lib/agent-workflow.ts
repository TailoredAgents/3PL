import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import {
  brokerageAgentNames,
  type BrokerageAgentName,
} from "@/lib/agent-config";
import {
  getAgentAutomationPolicy,
  getEffectiveAgentRunStatus,
} from "@/lib/agent-control";
import {
  getCarrierDetailView,
  getLeadDetailView,
  getLoadDetailView,
  getQuoteRequestDetailView,
} from "@/lib/crm";
import { enrichAgentContext } from "@/lib/agent-enrichment";
import { logAudit } from "@/lib/audit";
import { runBrokerageAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { getCurrentInternalUser } from "@/lib/current-user";
import { generateRateConfirmationDocument } from "@/lib/rate-confirmation";
import { getAgentMode, getAgentPromptTemplate } from "@/lib/settings";

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
  const policy = getAgentAutomationPolicy(input.agentName);
  const runStatus = getEffectiveAgentRunStatus({ mode, policy });
  const instructions = await getAgentPromptTemplate(input.agentName);

  try {
    const agentResult = await runBrokerageAgent({
      agentName: input.agentName,
      relatedEntityType: input.relatedEntityType,
      context,
      instructions,
    });
    let runId: string | undefined;

    if (hasDatabaseUrl() && prisma) {
      const run = await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: runStatus,
          prompt: `Template: ${input.agentName} v${instructions.version}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            automationMode: mode,
            riskLevel: policy.riskLevel,
            approvalRequired: policy.approvalRequired,
            gatedActions: policy.gatedActions,
            context: context as Prisma.InputJsonValue,
          },
          outputJson: agentResult,
          confidence: agentResult.confidence,
          automationMode: mode,
          riskLevel: policy.riskLevel,
          approvalRequired: policy.approvalRequired,
          actionSummary: policy.actionSummary,
          promptVersion: instructions.version,
          promptSnapshot: {
            agentName: instructions.agentName,
            version: instructions.version,
            systemPrompt: instructions.systemPrompt,
            task: instructions.task,
            placeholderNextAction: instructions.placeholderNextAction,
          },
          controlJson: {
            gatedActions: policy.gatedActions,
            approvalGate:
              runStatus === "NEEDS_HUMAN_APPROVAL"
                ? "Required before execution."
                : "No external or sensitive action executed.",
          },
        },
      });
      runId = run.id;

      if (runStatus === "COMPLETED") {
        await maybeCreateActivity(input, agentResult);
      }
    }

    revalidateAgentEntityPaths(input.relatedEntityType, input.relatedEntityId);

    return { agentResult, runId, status: runStatus };
  } catch (error) {
    if (hasDatabaseUrl() && prisma) {
      await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: "FAILED",
          prompt: `Template: ${input.agentName} v${instructions.version}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            automationMode: mode,
            riskLevel: policy.riskLevel,
            approvalRequired: policy.approvalRequired,
            gatedActions: policy.gatedActions,
            context: context as Prisma.InputJsonValue,
          },
          automationMode: mode,
          riskLevel: policy.riskLevel,
          approvalRequired: policy.approvalRequired,
          actionSummary: policy.actionSummary,
          promptVersion: instructions.version,
          promptSnapshot: {
            agentName: instructions.agentName,
            version: instructions.version,
            systemPrompt: instructions.systemPrompt,
            task: instructions.task,
            placeholderNextAction: instructions.placeholderNextAction,
          },
          controlJson: {
            gatedActions: policy.gatedActions,
            failure: "Agent run failed before producing usable output.",
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

export async function approveAgentRun(runId: string, reviewNotes?: string) {
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

  const user = await getCurrentInternalUser();
  const run = await prisma.aiAgentRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      approvedAt: new Date(),
      approvedByUserId: user?.id ?? null,
      reviewNotes: reviewNotes?.trim() || existing.reviewNotes,
    },
  });

  await maybeCreateActivity(
    {
      relatedEntityType: run.relatedEntityType ?? "",
      relatedEntityId: run.relatedEntityId ?? "",
      agentName: run.agentName,
    },
    getAgentResultFromOutput(run.outputJson),
  );
  await maybeApplyApprovedAgentRun(run);
  await logAudit({
    action: "AI_AGENT_APPROVED",
    entityType: "AiAgentRun",
    entityId: run.id,
    summary: `${run.agentName} output approved.`,
    user,
    beforeJson: { status: existing.status },
    afterJson: { status: run.status, reviewNotes: run.reviewNotes },
    metadata: {
      relatedEntityType: run.relatedEntityType,
      relatedEntityId: run.relatedEntityId,
    },
  });

  if (run.relatedEntityType && run.relatedEntityId) {
    revalidateAgentEntityPaths(
      run.relatedEntityType as AgentEntityType,
      run.relatedEntityId,
    );
  }

  revalidatePath("/agents");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return run;
}

export async function rejectAgentRun(runId: string, reviewNotes?: string) {
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
    throw new Error("Only agent runs awaiting approval can be rejected.");
  }

  const user = await getCurrentInternalUser();
  const run = await prisma.aiAgentRun.update({
    where: { id: runId },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectedByUserId: user?.id ?? null,
      reviewNotes: reviewNotes?.trim() || existing.reviewNotes,
    },
  });
  await logAudit({
    action: "AI_AGENT_REJECTED",
    entityType: "AiAgentRun",
    entityId: run.id,
    summary: `${run.agentName} output rejected.`,
    user,
    beforeJson: { status: existing.status },
    afterJson: { status: run.status, reviewNotes: run.reviewNotes },
    metadata: {
      relatedEntityType: run.relatedEntityType,
      relatedEntityId: run.relatedEntityId,
    },
  });

  if (run.relatedEntityType && run.relatedEntityId) {
    revalidateAgentEntityPaths(
      run.relatedEntityType as AgentEntityType,
      run.relatedEntityId,
    );
  }

  revalidatePath("/agents");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

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
    revalidatePath("/documents");
    revalidatePath("/carrier-portal");
  }

  if (entityType === "Carrier") {
    revalidatePath("/carriers");
    revalidatePath(`/carriers/${id}`);
  }
}

async function maybeApplyApprovedAgentRun(run: {
  agentName: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}) {
  if (
    run.agentName !== "Rate Confirmation Agent" ||
    run.relatedEntityType !== "Load" ||
    !run.relatedEntityId ||
    !hasDatabaseUrl() ||
    !prisma
  ) {
    return;
  }

  const load = await prisma.load.findUnique({
    where: { id: run.relatedEntityId },
    select: {
      id: true,
      loadNumber: true,
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!load || load.documents.length) {
    return;
  }

  try {
    await generateRateConfirmationDocument(load.id);
  } catch (error) {
    await prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message:
          error instanceof Error
            ? `Rate Confirmation Agent approved, but PDF draft was blocked: ${error.message}`
            : "Rate Confirmation Agent approved, but PDF draft was blocked.",
        occurredAt: new Date(),
      },
    });
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

function getAgentResultFromOutput(outputJson: unknown) {
  if (!outputJson || typeof outputJson !== "object") {
    return {
      summary: "AI recommendation approved.",
      nextAction: "Review approved AI output and take the next step.",
    };
  }

  const output = outputJson as { summary?: unknown; nextAction?: unknown };

  return {
    summary:
      typeof output.summary === "string"
        ? output.summary
        : "AI recommendation approved.",
    nextAction:
      typeof output.nextAction === "string"
        ? output.nextAction
        : "Review approved AI output and take the next step.",
  };
}
