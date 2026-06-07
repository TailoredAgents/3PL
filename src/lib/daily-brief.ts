import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import {
  getAgentAutomationPolicy,
  getEffectiveAgentRunStatus,
} from "@/lib/agent-control";
import {
  type DailyBriefActionResult,
  type DailyBriefAgentResult,
  runDailyBriefAgent,
} from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  getAgentMode,
  getAgentPromptTemplate,
} from "@/lib/settings";

const dailyBriefAgentName = "Daily Brief Agent" as const;

export type DailyBriefView = {
  generatedAt: string;
  summary: string;
  confidence: number | null;
  nextAction: string;
  status: string;
  runId?: string;
  actions: DailyBriefActionResult[];
  metrics: Record<string, number>;
};

export async function getDailyBriefView(): Promise<DailyBriefView> {
  const context = await buildDailyBriefContext();
  const latest = await getLatestDailyBriefRun();

  if (!latest) {
    return {
      generatedAt: "Not generated yet",
      summary:
        "Generate the daily brief to turn today's work queues into an ordered sales and operations plan.",
      confidence: null,
      nextAction:
        context.recommendedActions[0]?.nextAction ??
        "Review Dashboard queues and generate a daily brief.",
      status: "Not Generated",
      actions: context.recommendedActions.slice(0, 8),
      metrics: context.metrics,
    };
  }

  const output = parseDailyBriefOutput(latest.outputJson);

  return {
    generatedAt: formatBriefDate(latest.createdAt),
    summary: output.summary,
    confidence: latest.confidence === null ? null : Number(latest.confidence),
    nextAction: output.nextAction,
    status: titleCaseEnum(latest.status),
    runId: latest.id,
    actions: output.orderedActions.length
      ? output.orderedActions
      : context.recommendedActions.slice(0, 8),
    metrics: context.metrics,
  };
}

export async function generateDailyBrief(): Promise<DailyBriefView> {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const context = await buildDailyBriefContext();
  const mode = await getAgentMode(dailyBriefAgentName);
  const policy = getAgentAutomationPolicy(dailyBriefAgentName);
  const runStatus = getEffectiveAgentRunStatus({ mode, policy });
  const instructions = await getAgentPromptTemplate(dailyBriefAgentName);
  const result = await runDailyBriefAgent({
    context,
    instructions,
  });
  const run = await prisma.aiAgentRun.create({
    data: {
      agentName: dailyBriefAgentName,
      relatedEntityType: "DailyBrief",
      relatedEntityId: context.generatedAt.slice(0, 10),
      status: runStatus,
      prompt: `Template: ${dailyBriefAgentName} v${instructions.version}`,
      inputJson: {
        requestedAt: context.generatedAt,
        automationMode: mode,
        riskLevel: policy.riskLevel,
        approvalRequired: policy.approvalRequired,
        gatedActions: policy.gatedActions,
        context: context as Prisma.InputJsonValue,
      },
      outputJson: result as unknown as Prisma.InputJsonValue,
      confidence: result.confidence,
      automationMode: mode,
      riskLevel: policy.riskLevel,
      approvalRequired: policy.approvalRequired,
      actionSummary:
        "Generated a daily sales and operations brief. No customer, carrier, billing, or compliance action was executed.",
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
          "Brief only. Humans must perform outreach, updates, billing, and approvals manually.",
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/agents");

  return {
    generatedAt: formatBriefDate(run.createdAt),
    summary: result.summary,
    confidence: result.confidence,
    nextAction: result.nextAction,
    status: titleCaseEnum(run.status),
    runId: run.id,
    actions: result.orderedActions,
    metrics: context.metrics,
  };
}

async function buildDailyBriefContext(): Promise<{
  generatedAt: string;
  metrics: Record<string, number>;
  recommendedActions: DailyBriefActionResult[];
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (!hasDatabaseUrl() || !prisma) {
    const recommendedActions = getSampleDailyBriefActions();

    return {
      generatedAt: now.toISOString(),
      metrics: {
        overdueLeadFollowUps: 2,
        staleCustomerContacts: 1,
        openQuotes: 2,
        quotedNoResponse: 1,
        customerUpdatesDue: 1,
        missingPods: 1,
        billingBlockers: 1,
        aiApprovals: 1,
      },
      recommendedActions,
    };
  }

  const [
    overdueLeads,
    activeLeads,
    openQuotes,
    quotedNoResponse,
    customerUpdateLoads,
    missingPodLoads,
    billingBlockers,
    aiApprovalRuns,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: {
        nextFollowUpAt: { lte: now },
        stage: { notIn: ["WON", "LOST"] },
      },
      include: { shipper: true, contact: true },
      orderBy: [{ priority: "asc" }, { nextFollowUpAt: "asc" }],
      take: 6,
    }),
    prisma.lead.findMany({
      where: { stage: { notIn: ["WON", "LOST"] } },
      include: {
        shipper: true,
        contact: true,
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "asc" }],
      take: 25,
    }),
    prisma.quoteRequest.findMany({
      where: { status: { in: ["NEW", "PRICING"] } },
      include: { shipper: true, contact: true },
      orderBy: [{ pickupDate: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.quoteRequest.findMany({
      where: { status: "QUOTED" },
      include: {
        shipper: true,
        contact: true,
        customerQuotes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "asc" },
      take: 6,
    }),
    prisma.load.findMany({
      where: {
        customerUpdateStatus: "NEEDED",
        status: { in: ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] },
      },
      include: { shipper: true },
      orderBy: [{ pickupDate: "asc" }, { updatedAt: "asc" }],
      take: 6,
    }),
    prisma.load.findMany({
      where: {
        status: "DELIVERED",
        documents: { none: { type: "POD" } },
      },
      include: { shipper: true },
      orderBy: [{ deliveryDate: "asc" }, { updatedAt: "asc" }],
      take: 6,
    }),
    prisma.carrierInvoice.findMany({
      where: { status: { in: ["RECEIVED", "DISPUTED"] } },
      include: { carrier: true, load: { include: { shipper: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.aiAgentRun.findMany({
      where: { status: "NEEDS_HUMAN_APPROVAL" },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
  ]);
  const staleLeadContacts = activeLeads.filter((lead) => {
    const latestActivity = lead.activities[0]?.createdAt;
    return !latestActivity || latestActivity < sevenDaysAgo;
  });
  const recommendedActions: DailyBriefActionResult[] = [
    ...overdueLeads.map((lead) => ({
      title: lead.shipper.companyName,
      detail: `${formatContactName(lead.contact)} is overdue for follow-up.`,
      nextAction: "Open Communications and draft a follow-up before new prospecting.",
      href: "/communications",
      category: "Overdue Follow-Up",
      priority: "High" as const,
    })),
    ...quotedNoResponse.map((quote) => ({
      title: `${quote.originCity}, ${quote.originState} to ${quote.destinationCity}, ${quote.destinationState}`,
      detail: `${quote.shipper.companyName} has a quoted lane waiting on customer response.`,
      nextAction: "Send a quote follow-up from Communications or the quote record.",
      href: `/quote-requests/${quote.id}`,
      category: "Quoted No Response",
      priority: "High" as const,
    })),
    ...openQuotes.map((quote) => ({
      title: `${quote.originCity}, ${quote.originState} to ${quote.destinationCity}, ${quote.destinationState}`,
      detail: `${quote.shipper.companyName} needs pricing work for ${quote.equipmentType}.`,
      nextAction: "Review details and price with DAT/Truckstop benchmarks.",
      href: `/quote-requests/${quote.id}`,
      category: "Open Quote",
      priority: "High" as const,
    })),
    ...customerUpdateLoads.map((load) => ({
      title: load.loadNumber
        ? String(load.loadNumber)
        : `${load.originCity}, ${load.originState}`,
      detail: `${load.shipper.companyName} needs a customer update on ${titleCaseEnum(load.status)} load.`,
      nextAction: "Open the load, confirm latest status, and send the customer update.",
      href: `/loads/${load.id}`,
      category: "Customer Update",
      priority: "Medium" as const,
    })),
    ...missingPodLoads.map((load) => ({
      title: load.loadNumber
        ? String(load.loadNumber)
        : `${load.originCity}, ${load.originState}`,
      detail: `${load.shipper.companyName} has a delivered load missing POD.`,
      nextAction: "Request POD from carrier and attach it to the load.",
      href: `/loads/${load.id}`,
      category: "Missing POD",
      priority: "Medium" as const,
    })),
    ...billingBlockers.map((invoice) => ({
      title: `${invoice.carrier.companyName} invoice`,
      detail: `${invoice.load.shipper.companyName} carrier invoice is ${titleCaseEnum(invoice.status)}.`,
      nextAction: "Review payable details and resolve the billing blocker.",
      href: "/payables",
      category: "Billing Blocker",
      priority: invoice.status === "DISPUTED" ? ("High" as const) : ("Medium" as const),
    })),
    ...staleLeadContacts.slice(0, 6).map((lead) => ({
      title: lead.shipper.companyName,
      detail: `${formatContactName(lead.contact)} has no recent logged contact.`,
      nextAction: "Open Communications and draft a no-response check-in.",
      href: "/communications",
      category: "Stale Customer Contact",
      priority: "Medium" as const,
    })),
    ...aiApprovalRuns.map((run) => ({
      title: run.agentName,
      detail: "AI output is waiting for human review.",
      nextAction: "Open AI Command Center and approve or reject the recommendation.",
      href: "/agents",
      category: "AI Approval",
      priority: "Low" as const,
    })),
  ].slice(0, 20);

  return {
    generatedAt: now.toISOString(),
    metrics: {
      overdueLeadFollowUps: overdueLeads.length,
      staleCustomerContacts: staleLeadContacts.length,
      openQuotes: openQuotes.length,
      quotedNoResponse: quotedNoResponse.length,
      customerUpdatesDue: customerUpdateLoads.length,
      missingPods: missingPodLoads.length,
      billingBlockers: billingBlockers.length,
      aiApprovals: aiApprovalRuns.length,
    },
    recommendedActions,
  };
}

async function getLatestDailyBriefRun() {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  return prisma.aiAgentRun.findFirst({
    where: { agentName: dailyBriefAgentName },
    orderBy: { createdAt: "desc" },
  });
}

function parseDailyBriefOutput(outputJson: unknown): DailyBriefAgentResult {
  if (!outputJson || typeof outputJson !== "object") {
    return {
      summary: "Daily brief output was not readable.",
      confidence: 0.25,
      nextAction: "Review work queues manually.",
      orderedActions: [],
    };
  }

  const output = outputJson as Partial<DailyBriefAgentResult>;

  return {
    summary:
      typeof output.summary === "string"
        ? output.summary
        : "Daily brief created.",
    confidence:
      typeof output.confidence === "number" ? output.confidence : 0.5,
    nextAction:
      typeof output.nextAction === "string"
        ? output.nextAction
        : "Review work queues manually.",
    orderedActions: Array.isArray(output.orderedActions)
      ? output.orderedActions
      : [],
  };
}

function getSampleDailyBriefActions(): DailyBriefActionResult[] {
  return [
    {
      title: "Peachtree Building Supply",
      detail: "Qualified shipper is due for follow-up on Atlanta to Dallas dry van freight.",
      nextAction: "Open Communications and draft a follow-up email.",
      href: "/communications",
      category: "Overdue Follow-Up",
      priority: "High",
    },
    {
      title: "Savannah, GA to Nashville, TN",
      detail: "Open quote needs market pricing before customer response.",
      nextAction: "Review quote details and pull DAT/Truckstop benchmarks.",
      href: "/quote-requests",
      category: "Open Quote",
      priority: "High",
    },
  ];
}

function formatContactName(
  contact: { firstName: string; lastName?: string | null } | null,
) {
  if (!contact) {
    return "No contact";
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

function formatBriefDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
