import { randomBytes } from "crypto";

import {
  activities,
  carriers,
  leads,
  loads,
  quoteRequests,
  shippers,
} from "@/lib/data";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  LoadStatus,
  type AiAgentRun,
  type EmailSuppressionReason,
} from "@prisma/client";
import {
  formatFileSize,
  getDocumentDownloadHref,
} from "@/lib/documents";
import { getMarketRateProviderReadiness } from "@/lib/rating/rate-intelligence";
import {
  getAgentPromptVersionViews,
  type AgentPromptVersionView,
} from "@/lib/settings";

export type LeadView = (typeof leads)[number];
export type ActivityView = (typeof activities)[number];
export type ShipperView = (typeof shippers)[number];
export type QuoteRequestView = (typeof quoteRequests)[number] & {
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  pickupWindow?: string;
  delivery?: string;
  deliveryWindow?: string;
  originAddress?: string;
  destinationAddress?: string;
  commodity?: string;
  palletCount?: string;
  pieceCount?: string;
  dimensions?: string;
  hazmat?: string;
  temperatureRequirement?: string;
  appointmentRequired?: string;
  accessorials?: string;
  customerReference?: string;
  urgency?: string;
  targetMarginPercent?: string;
  targetMarginPercentInput?: string;
  pricingNotes?: string;
  pickupDateInput?: string;
  deliveryDateInput?: string;
};
export type CarrierView = (typeof carriers)[number] & {
  authorityStatus?: string;
  insuranceStatus?: string;
  safetyRating?: string;
  fraudRiskLevel?: string;
  lastVettedAt?: string;
  approvedBy?: string;
  complianceNotes?: string;
  insuranceExpiration?: string;
  w9ReceivedAt?: string;
  agreementSignedAt?: string;
  paymentSetup?: string;
  callbackVerifiedAt?: string;
  blockedReason?: string;
  additionalContacts?: unknown;
  deliveredLoads?: number;
  avgMargin?: number;
  // Phase 3.2 scorecard
  onTimePickupRate?: number | null;
  issuesCount?: number;
};
export type LoadDocumentView = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  downloadHref: string | null;
  status: string;
  source: string;
  extractionStatus: string;
  mimeType: string;
  fileSize: string;
  storageState: string;
  created: string;
  extractedText?: string | null;
  extractedFields?: import("@/lib/documents").DocumentStructuredFields | null;
};
export type DocumentCenterView = LoadDocumentView & {
  relatedLabel: string;
  relatedHref: string | null;
  shipper: string;
  uploadedBy: string;
};
export type IntegrationLogView = {
  id: string;
  provider: string;
  action: string;
  status: string;
  message: string;
  error: string | null;
  created: string;
};

export type ProviderStatus = {
  name: string; // display label e.g. "xAI (Grok)"
  key?: string; // enum key e.g. "XAI"
  envKey?: string;
  configured: boolean;
  description: string;
  lastSuccess?: string | null;
  lastFailure?: string | null;
  recentLogs: IntegrationLogView[];
  recentCount: number;
  successCount: number;
  failureCount: number;
};
export type InvoiceView = {
  invoiceNumber?: string | null;
  amount: number;
  balance?: number | null;
  status: string;
  terms?: string | null;
  sentAt?: string | null;
  dueDate: string;
  paidAt: string;
};
export type CarrierQuoteView = {
  id: string;
  carrierId: string;
  carrier: string;
  complianceStatus: string;
  quotedRate: number;
  projectedMargin: number;
  projectedMarginPercent: number;
  status: string;
  notes: string;
  created: string;
};
export type CarrierSourcingCandidateView = {
  id: string;
  carrierId: string | null;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  mcNumber: string;
  dotNumber: string;
  source: string;
  status: string;
  suggestedRate: number | null;
  matchScore: number | null;
  complianceStatus: string;
  complianceSnapshot: string;
  notes: string;
  created: string;
};
export type LoadEventView = {
  type: string;
  message: string;
  location: string;
  time: string;
};

export type LoadExceptionView = {
  id: string;
  type: string;
  status: string;
  owner?: string | null;
  notes?: string | null;
  resolvedAt?: string | null;
  created: string;
};

export type PublicTrackingLinkView = {
  id: string;
  token: string;
  expiresAt: string;
  revoked: boolean;
  created: string;
};
export type LoadView = {
  id: string;
  loadNumber: string;
  shipper: string;
  carrier: string;
  lane: string;
  originAddress?: string;
  destinationAddress?: string;
  equipment: string;
  commodity?: string;
  weight?: string;
  palletCount?: string;
  pieceCount?: string;
  dimensions?: string;
  hazmat?: string;
  temperatureRequirement?: string;
  appointmentRequired?: string;
  accessorials?: string;
  customerReference?: string;
  status: string;
  pickup: string;
  pickupWindow?: string;
  delivery: string;
  deliveryWindow?: string;
  customerUpdateStatus?: string;
  lastCustomerUpdateAt?: string;
  rateConfirmationStatus?: string;
  rateConfirmationSentAt?: string;
  rateConfirmationSignedAt?: string;
  customerRate: number;
  carrierRate: number;
  margin: number;
  marginPercent: number;
  risk: string;
  hasPod: boolean;
  billingReadiness: string;
  invoice: InvoiceView | null;
  carrierInvoiceNumber: string | null;
  carrierPaymentDue: string | null;
  carrierPaidAt: string | null;
  carrierCandidates: CarrierSourcingCandidateView[];
  carrierQuotes: CarrierQuoteView[];
  integrationLogs: IntegrationLogView[];
  events: LoadEventView[];
  documents: LoadDocumentView[];
  exceptions: LoadExceptionView[];
  publicTrackingLinks: PublicTrackingLinkView[];
  // For internal tracking computations (Phase 5.1)
  rawPickupDate?: Date | null;
  rawDeliveryDate?: Date | null;
};
export type LoadDetailView = LoadView;
export type ContactSummaryView = {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
};
export type ContactDetailView = {
  id: string;
  shipperId: string;
  company: string;
  fullName: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  leads: LeadView[];
  activities: ActivityView[];
};
export type ShipperDetailView = ShipperView & {
  rawNotes: string;
  contacts: ContactSummaryView[];
  leads: LeadView[];
  quoteRequests: QuoteRequestView[];
  loads: LoadView[];
  documents: LoadDocumentView[];
};
export type CarrierDetailView = CarrierView & {
  loads: LoadView[];
  documents: LoadDocumentView[];
};
export type AiAgentRunView = {
  id: string;
  agentName: string;
  relatedEntityType: string;
  relatedEntityId: string;
  status: string;
  confidence: number | null;
  summary: string;
  nextAction: string;
  errorMessage?: string | null;
  automationMode: string;
  riskLevel: string;
  approvalRequired: boolean;
  actionSummary: string;
  promptVersion: number | null;
  gatedActions: string[];
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  created: string;
};
export type AiCommandCenterView = {
  metrics: {
    total: string;
    needsApproval: string;
    failed: string;
    completed: string;
    averageConfidence: string;
  };
  dailyBrief: DailyBriefItemView[];
  exceptions: AiExceptionView[];
  approvalQueue: AiAgentRunView[];
  failedRuns: AiAgentRunView[];
  recentRuns: AiAgentRunView[];
  promptHistory: AgentPromptVersionView[];
};
export type DailyBriefItemView = {
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: "default" | "warning" | "danger";
};
export type AiExceptionView = {
  id: string;
  type: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  detail: string;
  href: string;
};
export type EmailEventStatus =
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "UNKNOWN";
export type EmailEventView = {
  id: string;
  company: string;
  contact: string;
  subject: string;
  recipient: string;
  status: EmailEventStatus;
  outcome: string;
  detail: string;
  provider: string;
  messageId: string;
  eventId: string;
  time: string;
};
export type EmailSuppressionView = {
  id: string;
  email: string;
  reason: EmailSuppressionReason;
  sourceProvider: string;
  messageId: string;
  eventId: string;
  notes: string;
  lastEvent: string;
};
export type EmailEventDashboardView = {
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
  complainedCount: number;
  unknownCount: number;
  suppressedCount: number;
  exceptionCount: number;
  deliveryRate: string;
  webhookConfigured: boolean;
  events: EmailEventView[];
  exceptions: EmailEventView[];
  suppressions: EmailSuppressionView[];
};
export type QuoteRequestDetailView = QuoteRequestView & {
  id: string;
  contact: string;
  email: string;
  phone: string;
  specialRequirements: string;
  latestQuote: CustomerQuoteView | null;
  customerQuotes: CustomerQuoteView[];
  rateBenchmarks: RateBenchmarkView[];
  pricingRecommendations: PricingRecommendationView[];
  marketRateProviders: MarketRateProviderReadinessView[];
  laneHistory: LaneHistoryView[];
};

export type MarketRateProviderReadinessView = {
  provider: "DAT" | "TRUCKSTOP";
  label: string;
  configured: boolean;
  requiredEnv: string[];
  missingEnv: string[];
  message: string;
};

export type CustomerQuoteView = {
  id: string;
  quotedRate: number;
  targetCarrierCost: number | null;
  projectedGrossProfit: number | null;
  marginPercent: number | null;
  status: string;
  validUntil: string;
  created: string;
};

export type RateBenchmarkView = {
  id: string;
  source: string;
  sourceLabel: string;
  lowRate: number | null;
  highRate: number | null;
  averageRate: number;
  confidence: number | null;
  notes: string;
  created: string;
};

export type PricingRecommendationView = {
  id: string;
  source: string;
  recommendedCarrierCost: number;
  recommendedCustomerRate: number;
  projectedGrossProfit: number;
  marginPercent: number;
  targetMarginPercent: number | null;
  riskLevel: string;
  validForHours: number | null;
  summary: string;
  notes: string;
  created: string;
};

export type LaneHistoryView = {
  id: string;
  customerRate: number;
  carrierRate: number;
  margin: number;
  marginPercent: number;
  pickup: string;
  status: string;
};

export type LeadDetailView = LeadView & {
  source: string;
  title: string;
  phone: string;
  email: string;
  equipment: string;
  volume: string;
  activities: ActivityView[];
};
export type CommunicationMessageView = {
  id: string;
  channel: string;
  direction: string;
  subject: string;
  body: string;
  outcome: string;
  time: string;
};
export type CommunicationDraftAuditView = {
  runId: string;
  channel: string;
  purpose: string;
  subject: string;
  body: string;
  summary: string;
  confidence: number | null;
  nextAction: string;
  status: string;
  created: string;
};
export type CommunicationThreadView = {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  title: string;
  phone: string;
  email: string;
  stage: string;
  priority: string;
  lanes: string;
  equipment: string;
  volume: string;
  pain: string;
  nextFollowUp: string;
  aiNextAction: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: CommunicationMessageView[];
  latestAiDraft: CommunicationDraftAuditView | null;
};
export type CommunicationWorkspaceView = {
  threads: CommunicationThreadView[];
};

export async function getLeadViews(): Promise<LeadView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return leads;
  }

  try {
    const records = await prisma.lead.findMany({
      include: {
        shipper: true,
        contact: true,
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
      take: 100,
    });

    if (!records.length) {
      return leads;
    }

    return records.map((lead) => {
      const notes = `${lead.shipper.notes ?? ""}\n${lead.notes ?? ""}`;

      return {
        id: lead.id,
        company: lead.shipper.companyName,
        contact: formatContactName(lead.contact),
        title: lead.contact?.title ?? "Contact",
        phone: lead.contact?.phone ?? "No phone",
        email: lead.contact?.email ?? "No email",
        stage: titleCaseEnum(lead.stage),
        source: titleCaseEnum(lead.source).replace("Quote Form", "Instant Quote"),
        priority: formatPriority(lead.priority),
        lanes: extractField(notes, "Lanes") ?? "Lane details needed",
        equipment: extractField(notes, "Equipment") ?? "Equipment needed",
        volume: extractField(notes, "Volume") ?? "Volume unknown",
        nextFollowUp: lead.nextFollowUpAt
          ? formatFollowUp(lead.nextFollowUpAt)
          : "No follow-up set",
        pain: extractField(notes, "Pain") ?? lead.notes ?? "Needs qualification.",
        aiNextAction:
          lead.notes ??
          "Qualify lanes, shipment volume, current provider pain, and quoting urgency.",
      };
    });
  } catch {
    return leads;
  }
}

export async function getLeadDetailView(
  id: string,
): Promise<LeadDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleLeadDetailView(id);
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        shipper: true,
        contact: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!lead) {
      return getSampleLeadDetailView(id);
    }

    const notes = `${lead.shipper.notes ?? ""}\n${lead.notes ?? ""}`;

    return {
      id: lead.id,
      company: lead.shipper.companyName,
      contact: formatContactName(lead.contact),
      title: lead.contact?.title ?? "Contact",
      phone: lead.contact?.phone ?? "No phone",
      email: lead.contact?.email ?? "No email",
      stage: titleCaseEnum(lead.stage),
      source: titleCaseEnum(lead.source).replace("Quote Form", "Instant Quote"),
      priority: formatPriority(lead.priority),
      lanes: extractField(notes, "Lanes") ?? "Lane details needed",
      equipment: extractField(notes, "Equipment") ?? "Equipment needed",
      volume: extractField(notes, "Volume") ?? "Volume unknown",
      nextFollowUp: lead.nextFollowUpAt
        ? formatFollowUp(lead.nextFollowUpAt)
        : "No follow-up set",
      pain: extractField(notes, "Pain") ?? lead.notes ?? "Needs qualification.",
      aiNextAction:
        lead.notes ??
        "Qualify lanes, shipment volume, current provider pain, and quoting urgency.",
      activities: lead.activities.length
        ? lead.activities.map((activity) => ({
            company: lead.shipper.companyName,
            type: titleCaseEnum(activity.type),
            detail: activity.body ?? activity.subject ?? "Activity recorded.",
            time: formatFollowUp(activity.createdAt),
          }))
        : activities.filter((activity) => activity.company === lead.shipper.companyName),
    };
  } catch {
    return getSampleLeadDetailView(id);
  }
}

export async function getCommunicationWorkspaceView(): Promise<CommunicationWorkspaceView> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleCommunicationWorkspaceView();
  }

  try {
    const records = await prisma.lead.findMany({
      include: {
        shipper: true,
        contact: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
      take: 50,
    });

    if (!records.length) {
      return getSampleCommunicationWorkspaceView();
    }

    const latestDraftRuns = await prisma.aiAgentRun.findMany({
      where: {
        relatedEntityType: "Lead",
        relatedEntityId: { in: records.map((lead) => lead.id) },
        actionSummary: { startsWith: "Drafted" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const draftByLeadId = new Map<string, AiAgentRun>();

    for (const run of latestDraftRuns) {
      if (run.relatedEntityId && !draftByLeadId.has(run.relatedEntityId)) {
        draftByLeadId.set(run.relatedEntityId, run);
      }
    }

    return {
      threads: records.map((lead) => {
        const notes = `${lead.shipper.notes ?? ""}\n${lead.notes ?? ""}`;
        const messages = lead.activities.map((activity) => ({
          id: activity.id,
          channel: titleCaseEnum(activity.type),
          direction: titleCaseEnum(activity.direction),
          subject: activity.subject ?? titleCaseEnum(activity.type),
          body: activity.body ?? "No message body recorded.",
          outcome: activity.outcome ?? "No outcome recorded.",
          time: formatFollowUp(activity.createdAt),
        }));
        const latest = messages[0];

        return {
          id: lead.id,
          leadId: lead.id,
          company: lead.shipper.companyName,
          contact: formatContactName(lead.contact),
          title: lead.contact?.title ?? "Contact",
          phone: lead.contact?.phone ?? "No phone",
          email: lead.contact?.email ?? "No email",
          stage: titleCaseEnum(lead.stage),
          priority: formatPriority(lead.priority),
          lanes: extractField(notes, "Lanes") ?? "Lane details needed",
          equipment: extractField(notes, "Equipment") ?? "Equipment needed",
          volume: extractField(notes, "Volume") ?? "Volume unknown",
          nextFollowUp: lead.nextFollowUpAt
            ? formatFollowUp(lead.nextFollowUpAt)
            : "No follow-up set",
          pain: extractField(notes, "Pain") ?? lead.notes ?? "Needs qualification.",
          aiNextAction:
            lead.notes ??
            "Qualify lanes, shipment volume, current provider pain, and quoting urgency.",
          lastMessage: latest?.body ?? "No communication logged yet.",
          lastMessageTime: latest?.time ?? "No activity",
          messages,
          latestAiDraft: mapCommunicationDraftRun(draftByLeadId.get(lead.id)),
        };
      }),
    };
  } catch {
    return getSampleCommunicationWorkspaceView();
  }
}

export async function getIntakeViews() {
  if (!hasDatabaseUrl() || !prisma) {
    return [
      {
        id: "sample-audit",
        type: "Savings Audit",
        company: "Peachtree Building Supply",
        status: "Completed",
        detail: "Audit request for recurring Atlanta to Dallas dry van lanes.",
        created: "Today",
      },
      {
        id: "sample-quote",
        type: "Instant Quote",
        company: "Southline Foods",
        status: "New",
        detail: "Savannah, GA -> Nashville, TN reefer quote request.",
        created: "Today",
      },
    ];
  }

  try {
    const [audits, quotes] = await Promise.all([
      prisma.savingsAudit.findMany({
        include: { shipper: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.quoteRequest.findMany({
        include: { shipper: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    const auditViews = audits.map((audit) => ({
      id: audit.id,
      type: "Savings Audit",
      company: audit.shipper.companyName,
      status: titleCaseEnum(audit.status),
      detail: audit.reportSummary ?? "Audit submitted and waiting for review.",
      created: formatFollowUp(audit.createdAt),
    }));

    const quoteViews = quotes.map((quote) => ({
      id: quote.id,
      type: "Quote Request",
      company: quote.shipper.companyName,
      status: titleCaseEnum(quote.status),
      detail: `${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState} (${quote.equipmentType})`,
      created: formatFollowUp(quote.createdAt),
    }));

    return [...auditViews, ...quoteViews].sort((a, b) =>
      a.created < b.created ? 1 : -1,
    );
  } catch {
    return [];
  }
}

export async function getDashboardMetrics() {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleDashboardMetrics();
  }

  try {
    const now = new Date();
    const [leadsDue, openQuotes, activeLoads, loadMargins, leadGroups] =
      await Promise.all([
        prisma.lead.count({
          where: {
            OR: [{ nextFollowUpAt: { lte: now } }, { nextFollowUpAt: null }],
            stage: { notIn: ["WON", "LOST"] },
          },
        }),
        prisma.quoteRequest.count({
          where: { status: { in: ["NEW", "PRICING", "QUOTED"] } },
        }),
        prisma.load.count({
          where: {
            status: {
              in: ["TENDERED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"],
            },
          },
        }),
        prisma.load.findMany({
          select: { grossProfit: true },
          where: { grossProfit: { not: null } },
        }),
        prisma.lead.groupBy({
          by: ["stage"],
          _count: true,
        }),
      ]);
    const margin = loadMargins.reduce(
      (sum, load) => sum + Number(load.grossProfit ?? 0),
      0,
    );
    const databaseIsEmpty =
      leadsDue === 0 &&
      openQuotes === 0 &&
      activeLoads === 0 &&
      leadGroups.length === 0;

    if (databaseIsEmpty) {
      return getSampleDashboardMetrics();
    }

    return {
      leadsDue: leadsDue.toString(),
      openQuotes: openQuotes.toString(),
      activeLoads: activeLoads.toString(),
      projectedMargin: `$${margin.toLocaleString()}`,
      leadPipeline: ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON"].map(
        (stage) => ({
          stage: titleCaseEnum(stage),
          count:
            leadGroups.find((group) => group.stage === stage)?._count ?? 0,
          amount: "-",
        }),
      ),
    };
  } catch {
    return getSampleDashboardMetrics();
  }
}

function getSampleDashboardMetrics() {
  return {
    leadsDue: leads.length.toString(),
    openQuotes: quoteRequests.length.toString(),
    activeLoads: loads.length.toString(),
    projectedMargin: `$${loads.reduce((sum, load) => sum + load.margin, 0).toLocaleString()}`,
    leadPipeline: ["New", "Contacted", "Qualified", "Quoted", "Won"].map(
      (stage) => ({
        stage,
        count: leads.filter((lead) => lead.stage === stage).length,
        amount: "-",
      }),
    ),
  };
}

export type SalesOpportunityView = {
  id: string;
  category: string;
  title: string;
  entity: string;
  detail: string;
  nextAction: string;
  impact: string;
  href: string;
  priority: number;
  tone: "amber" | "emerald" | "red" | "sky" | "violet";
};

export async function getSalesOpportunityInsights(): Promise<SalesOpportunityView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleSalesOpportunities();
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dormantCutoff = new Date(now);
    dormantCutoff.setDate(dormantCutoff.getDate() - 30);

    const [overdueLeads, quoteRequests, completedLoads, shippers] =
      await Promise.all([
        prisma.lead.findMany({
          where: {
            OR: [{ nextFollowUpAt: { lte: now } }, { nextFollowUpAt: null }],
            stage: { notIn: ["WON", "LOST"] },
          },
          include: { shipper: true, contact: true },
          orderBy: [{ priority: "asc" }, { nextFollowUpAt: "asc" }],
          take: 6,
        }),
        prisma.quoteRequest.findMany({
          where: { status: { in: ["NEW", "PRICING", "QUOTED"] } },
          select: {
            id: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
            equipmentType: true,
            status: true,
            pickupDate: true,
            createdAt: true,
            shipper: { select: { companyName: true } },
            customerQuotes: {
              select: { status: true, quotedRate: true },
              orderBy: { createdAt: "desc" },
            },
            rateBenchmarks: {
              select: { source: true, averageRate: true, confidence: true },
              orderBy: { createdAt: "desc" },
            },
            pricingRecommendations: {
              select: { id: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: [{ pickupDate: "asc" }, { createdAt: "asc" }],
          take: 12,
        }),
        prisma.load.findMany({
          select: {
            customerRate: true,
            carrierRate: true,
            grossProfit: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
            equipmentType: true,
            status: true,
            createdAt: true,
            shipper: { select: { companyName: true } },
            carrier: { select: { companyName: true } },
          },
          where: { status: { in: ["INVOICED", "PAID", "POD_RECEIVED", "DELIVERED"] } },
          take: 1000,
        }),
        prisma.shipper.findMany({
          where: { status: { in: ["LEAD", "ACTIVE"] } },
          select: {
            id: true,
            companyName: true,
            status: true,
            updatedAt: true,
            activities: {
              select: { createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            leads: {
              select: { updatedAt: true },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
            quoteRequests: {
              select: { updatedAt: true },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
            loads: {
              select: { updatedAt: true },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "asc" },
          take: 200,
        }),
      ]);

    const laneIntelligence = buildLaneIntelligence(completedLoads, quoteRequests);
    const opportunities: SalesOpportunityView[] = [
      ...overdueLeads.map((lead) => ({
        id: `lead-follow-up-${lead.id}`,
        category: "Customer follow-up",
        title: lead.shipper.companyName,
        entity: formatContactName(lead.contact),
        detail: lead.nextFollowUpAt
          ? `Follow-up was due ${formatFollowUp(lead.nextFollowUpAt)}.`
          : "No follow-up date is set for this open lead.",
        nextAction: "Call or email the contact and log the outcome.",
        impact: "Keeps active prospects from going cold.",
        href: `/leads/${lead.id}`,
        priority: lead.priority <= 2 ? 95 : 82,
        tone: lead.priority <= 2 ? "red" : "amber",
      } satisfies SalesOpportunityView)),
      ...quoteRequests
        .map((quote) => buildQuoteSalesOpportunity(quote, tomorrow))
        .filter((item): item is SalesOpportunityView => item !== null),
      ...buildLaneSalesOpportunities(laneIntelligence.profiles),
      ...shippers
        .map((shipper) => buildDormantShipperOpportunity(shipper, dormantCutoff))
        .filter((item): item is SalesOpportunityView => item !== null),
    ];

    if (!opportunities.length) {
      return getSampleSalesOpportunities();
    }

    return opportunities
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  } catch {
    return getSampleSalesOpportunities();
  }
}

function buildQuoteSalesOpportunity(
  quote: {
    id: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    equipmentType: string;
    status: string;
    pickupDate: Date | null;
    shipper: { companyName: string };
    rateBenchmarks: { source: string }[];
    pricingRecommendations: { id: string }[];
  },
  tomorrow: Date,
): SalesOpportunityView | null {
  const hasMarketBenchmark = quote.rateBenchmarks.some((benchmark) =>
    ["DAT", "TRUCKSTOP"].includes(benchmark.source),
  );
  const hasRecommendation = quote.pricingRecommendations.length > 0;
  const pickupSoon = quote.pickupDate ? quote.pickupDate <= tomorrow : false;

  if (hasMarketBenchmark && hasRecommendation && !pickupSoon) {
    return null;
  }

  const lane = `${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState}`;
  const missing = [
    hasMarketBenchmark ? null : "DAT/Truckstop benchmark",
    hasRecommendation ? null : "pricing recommendation",
    pickupSoon ? "pickup is soon" : null,
  ].filter(Boolean);

  return {
    id: `quote-${quote.id}`,
    category: "Quote action",
    title: lane,
    entity: quote.shipper.companyName,
    detail: `${titleCaseEnum(quote.status)} quote needs ${missing.join(", ")}.`,
    nextAction: "Open the quote, add market intelligence, and send the customer rate.",
    impact: "Speeds quote turnaround while protecting margin.",
    href: `/quote-requests/${quote.id}`,
    priority: pickupSoon ? 94 : hasMarketBenchmark ? 76 : 88,
    tone: pickupSoon ? "red" : "amber",
  };
}

function buildLaneSalesOpportunities(
  profiles: LaneIntelligenceProfile[],
): SalesOpportunityView[] {
  const opportunities: SalesOpportunityView[] = [];
  const underpriced = profiles
    .filter((profile) => profile.loadCount > 0 && profile.avgMarginPercent < 15)
    .sort((a, b) => a.avgMarginPercent - b.avgMarginPercent)
    .slice(0, 2);
  const repeat = profiles
    .filter((profile) => profile.loadCount >= 2 || profile.quoteRequestCount >= 3)
    .sort((a, b) => b.avgGrossProfit - a.avgGrossProfit)
    .slice(0, 2);
  const lowConfidence = profiles
    .filter((profile) => profile.quoteRequestCount > 0 && profile.quoteConfidence < 60)
    .sort((a, b) => a.quoteConfidence - b.quoteConfidence)
    .slice(0, 2);
  const carrierGap = profiles
    .filter((profile) => profile.loadCount > 0 && profile.carrierCount <= 1)
    .sort((a, b) => b.loadCount - a.loadCount)
    .slice(0, 2);

  for (const lane of underpriced) {
    opportunities.push({
      id: `underpriced-${lane.key}`,
      category: "Margin review",
      title: `${lane.origin} -> ${lane.destination}`,
      entity: lane.topCustomer,
      detail: `Average margin is ${lane.avgMarginPercent}% on ${lane.loadCount} completed load${lane.loadCount === 1 ? "" : "s"}.`,
      nextAction: "Create or adjust the lane margin rule before the next quote.",
      impact: "Prevents repeat freight from eroding gross profit.",
      href: "/analytics",
      priority: 90,
      tone: "red",
    });
  }

  for (const lane of repeat) {
    opportunities.push({
      id: `repeat-${lane.key}`,
      category: "Repeat lane",
      title: `${lane.origin} -> ${lane.destination}`,
      entity: lane.topCustomer,
      detail: `${lane.loadCount} loads and ${lane.quoteRequestCount} quote requests show recurring activity.`,
      nextAction: "Save a quote template and ask the customer about upcoming volume.",
      impact: "Turns one-off spot freight into repeat business.",
      href: "/analytics",
      priority: 78,
      tone: "emerald",
    });
  }

  for (const lane of lowConfidence) {
    opportunities.push({
      id: `confidence-${lane.key}`,
      category: "Benchmark gap",
      title: `${lane.origin} -> ${lane.destination}`,
      entity: lane.topCustomer,
      detail: `Quote confidence is ${lane.quoteConfidence}% with limited benchmark or history support.`,
      nextAction: "Add DAT/Truckstop or manual benchmark data before quoting.",
      impact: "Reduces pricing risk on uncertain lanes.",
      href: "/analytics",
      priority: 74,
      tone: "amber",
    });
  }

  for (const lane of carrierGap) {
    opportunities.push({
      id: `carrier-gap-${lane.key}`,
      category: "Carrier coverage",
      title: `${lane.origin} -> ${lane.destination}`,
      entity: lane.topCarrier,
      detail: `Only ${lane.carrierCount} carrier in history for this lane.`,
      nextAction: "Source more vetted carriers before the next tender.",
      impact: "Protects service and buy-rate leverage.",
      href: "/carriers",
      priority: 70,
      tone: "sky",
    });
  }

  return opportunities;
}

function buildDormantShipperOpportunity(
  shipper: {
    id: string;
    companyName: string;
    status: string;
    updatedAt: Date;
    activities: { createdAt: Date }[];
    leads: { updatedAt: Date }[];
    quoteRequests: { updatedAt: Date }[];
    loads: { updatedAt: Date }[];
  },
  dormantCutoff: Date,
): SalesOpportunityView | null {
  const lastTouch = [
    shipper.updatedAt,
    shipper.activities[0]?.createdAt,
    shipper.leads[0]?.updatedAt,
    shipper.quoteRequests[0]?.updatedAt,
    shipper.loads[0]?.updatedAt,
  ]
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!lastTouch || lastTouch > dormantCutoff) {
    return null;
  }

  return {
    id: `dormant-shipper-${shipper.id}`,
    category: "Dormant customer",
    title: shipper.companyName,
    entity: titleCaseEnum(shipper.status),
    detail: `No visible activity since ${formatDate(lastTouch)}.`,
    nextAction: "Call with lane history, current capacity, and a fresh quote offer.",
    impact: "Reactivates customers before they disappear from the pipeline.",
    href: `/shippers/${shipper.id}`,
    priority: shipper.status === "ACTIVE" ? 72 : 62,
    tone: "violet",
  };
}

function getSampleSalesOpportunities(): SalesOpportunityView[] {
  return [
    {
      id: "sample-follow-up",
      category: "Customer follow-up",
      title: "Northstar Building Supply",
      entity: "Austin Carter",
      detail: "Follow-up is due on a recurring Atlanta to Dallas dry van lane.",
      nextAction: "Call and ask about next week volume.",
      impact: "Keeps a qualified prospect moving.",
      href: "/leads",
      priority: 92,
      tone: "amber",
    },
    {
      id: "sample-margin",
      category: "Margin review",
      title: "Savannah, GA -> Atlanta, GA",
      entity: "Cold Chain Foods",
      detail: "Average lane margin is below the 15% floor.",
      nextAction: "Adjust the margin rule before quoting again.",
      impact: "Protects repeat reefer profitability.",
      href: "/analytics",
      priority: 88,
      tone: "red",
    },
    {
      id: "sample-repeat",
      category: "Repeat lane",
      title: "Atlanta, GA -> Nashville, TN",
      entity: "Apex Manufacturing",
      detail: "Recurring quote/load activity is strong enough for a saved template.",
      nextAction: "Create a saved quote template and ask for upcoming volume.",
      impact: "Turns spot freight into a repeat lane.",
      href: "/analytics",
      priority: 78,
      tone: "emerald",
    },
  ];
}

export type SearchResultItem = {
  id: string;
  type: "Load" | "Lead" | "Shipper" | "Carrier";
  title: string;
  subtitle: string;
  href: string;
};

export async function getSearchResults(
  q: string,
): Promise<SearchResultItem[]> {
  const term = q.trim().toLowerCase();
  if (!term || term.length < 2) return [];

  if (!hasDatabaseUrl() || !prisma) {
    return getSampleSearchResults(term);
  }

  try {
    const [dbLeads, dbShippers, dbCarriers, dbLoads] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            {
              shipper: { companyName: { contains: q, mode: "insensitive" } },
            },
            {
              contact: {
                OR: [
                  { firstName: { contains: q, mode: "insensitive" } },
                  { lastName: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
        select: {
          id: true,
          stage: true,
          shipper: { select: { companyName: true } },
        },
        take: 5,
      }),
      prisma.shipper.findMany({
        where: { companyName: { contains: q, mode: "insensitive" } },
        select: { id: true, companyName: true, status: true },
        take: 5,
      }),
      prisma.carrier.findMany({
        where: {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { mcNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          companyName: true,
          complianceStatus: true,
          mcNumber: true,
        },
        take: 5,
      }),
      prisma.load.findMany({
        where: {
          OR: [
            { shipper: { companyName: { contains: q, mode: "insensitive" } } },
            { originCity: { contains: q, mode: "insensitive" } },
            { destinationCity: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          loadNumber: true,
          shipper: { select: { companyName: true } },
          originCity: true,
          originState: true,
          destinationCity: true,
          destinationState: true,
          status: true,
        },
        take: 5,
      }),
    ]);

    const results: SearchResultItem[] = [
      ...dbLeads.map((l) => ({
        id: l.id,
        type: "Lead" as const,
        title: l.shipper.companyName,
        subtitle: `Pipeline: ${titleCaseEnum(l.stage)}`,
        href: `/leads/${l.id}`,
      })),
      ...dbShippers.map((s) => ({
        id: s.id,
        type: "Shipper" as const,
        title: s.companyName,
        subtitle: `Status: ${titleCaseEnum(s.status)}`,
        href: `/shippers/${s.id}`,
      })),
      ...dbCarriers.map((c) => ({
        id: c.id,
        type: "Carrier" as const,
        title: c.companyName,
        subtitle: `${c.mcNumber ?? "MC unknown"} | ${titleCaseEnum(c.complianceStatus)}`,
        href: `/carriers/${c.id}`,
      })),
      ...dbLoads.map((l) => ({
        id: l.id,
        type: "Load" as const,
        title: l.loadNumber
          ? `LD-${String(l.loadNumber).padStart(4, "0")}`
          : l.shipper.companyName,
        subtitle: `${l.originCity}, ${l.originState} → ${l.destinationCity}, ${l.destinationState} | ${titleCaseEnum(l.status)}`,
        href: `/loads/${l.id}`,
      })),
    ];

    return results;
  } catch {
    return getSampleSearchResults(term);
  }
}

function getSampleSearchResults(term: string): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  for (const lead of leads) {
    if (
      lead.company.toLowerCase().includes(term) ||
      lead.contact.toLowerCase().includes(term)
    ) {
      results.push({
        id: lead.id,
        type: "Lead",
        title: lead.company,
        subtitle: `Pipeline: ${lead.stage}`,
        href: `/leads/${lead.id}`,
      });
    }
  }

  for (const carrier of carriers) {
    if (
      carrier.company.toLowerCase().includes(term) ||
      carrier.mcNumber.toLowerCase().includes(term)
    ) {
      results.push({
        id: carrier.id,
        type: "Carrier",
        title: carrier.company,
        subtitle: `${carrier.mcNumber} | ${carrier.complianceStatus}`,
        href: `/carriers/${carrier.id}`,
      });
    }
  }

  for (const load of loads) {
    if (
      load.shipper.toLowerCase().includes(term) ||
      load.lane.toLowerCase().includes(term) ||
      load.loadNumber.toLowerCase().includes(term)
    ) {
      results.push({
        id: load.id,
        type: "Load",
        title: load.loadNumber,
        subtitle: `${load.lane} | ${load.status}`,
        href: `/loads/${load.id}`,
      });
    }
  }

  return results;
}

export type TodayScheduleItem = {
  id: string;
  loadNumber: string;
  shipper: string;
  carrier: string;
  lane: string;
  eventType: "Pickup" | "Delivery";
  window: string;
  status: string;
};

export async function getTodayScheduleView(): Promise<TodayScheduleItem[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleTodaySchedule();
  }
  try {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const loads = await prisma.load.findMany({
      where: {
        OR: [
          { pickupDate: { gte: start, lte: end } },
          { deliveryDate: { gte: start, lte: end } },
        ],
        status: {
          in: ["TENDERED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"],
        },
      },
      select: {
        id: true,
        loadNumber: true,
        shipper: { select: { companyName: true } },
        carrier: { select: { companyName: true } },
        originCity: true,
        originState: true,
        destinationCity: true,
        destinationState: true,
        pickupDate: true,
        pickupWindow: true,
        deliveryDate: true,
        deliveryWindow: true,
        status: true,
      },
      orderBy: [{ pickupDate: "asc" }, { deliveryDate: "asc" }],
    });

    const items: TodayScheduleItem[] = [];
    for (const load of loads) {
      const lane = `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`;
      const loadNum = load.loadNumber
        ? `LD-${String(load.loadNumber).padStart(4, "0")}`
        : "LD-????";
      if (
        load.pickupDate &&
        load.pickupDate >= start &&
        load.pickupDate <= end
      ) {
        items.push({
          id: load.id,
          loadNumber: loadNum,
          shipper: load.shipper.companyName,
          carrier: load.carrier?.companyName ?? "Carrier needed",
          lane,
          eventType: "Pickup",
          window: load.pickupWindow ?? "Window needed",
          status: titleCaseEnum(load.status),
        });
      }
      if (
        load.deliveryDate &&
        load.deliveryDate >= start &&
        load.deliveryDate <= end
      ) {
        items.push({
          id: load.id,
          loadNumber: loadNum,
          shipper: load.shipper.companyName,
          carrier: load.carrier?.companyName ?? "Carrier needed",
          lane,
          eventType: "Delivery",
          window: load.deliveryWindow ?? "Window needed",
          status: titleCaseEnum(load.status),
        });
      }
    }
    return items;
  } catch {
    return getSampleTodaySchedule();
  }
}

function getSampleTodaySchedule(): TodayScheduleItem[] {
  return [
    {
      id: "load-atl-dal-001",
      loadNumber: "LD-0001",
      shipper: "Peachtree Building Supply",
      carrier: "Blue Ridge Transport",
      lane: "Atlanta, GA -> Dallas, TX",
      eventType: "Pickup",
      window: "08:00–10:00",
      status: "Booked",
    },
    {
      id: "load-sav-nas-002",
      loadNumber: "LD-0002",
      shipper: "Southline Foods",
      carrier: "Magnolia Reefer Lines",
      lane: "Savannah, GA -> Nashville, TN",
      eventType: "Delivery",
      window: "14:00–16:00",
      status: "In Transit",
    },
  ];
}

export type StaleLoadAlert = {
  id: string;
  loadNumber: string;
  lane: string;
  status: string;
  shipper: string;
  carrier: string;
  lastEventAt: string | null;
  hoursStale: number;
};

export async function getStaleLoadAlerts(): Promise<StaleLoadAlert[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const loads = await prisma.load.findMany({
      where: {
        status: { in: ["TENDERED", "BOOKED", "PICKED_UP", "IN_TRANSIT"] },
      },
      select: {
        id: true,
        loadNumber: true,
        status: true,
        originCity: true,
        originState: true,
        destinationCity: true,
        destinationState: true,
        shipper: { select: { companyName: true } },
        carrier: { select: { companyName: true } },
        events: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true },
        },
      },
    });

    const stale: StaleLoadAlert[] = [];
    for (const load of loads) {
      const lastEvent = load.events[0];
      const lastAt = lastEvent?.occurredAt ?? null;
      if (lastAt && lastAt >= cutoff) continue;
      const hoursAgo = lastAt
        ? Math.floor((Date.now() - lastAt.getTime()) / (1000 * 60 * 60))
        : 999;
      stale.push({
        id: load.id,
        loadNumber: load.loadNumber
          ? `LD-${String(load.loadNumber).padStart(4, "0")}`
          : "LD-????",
        lane: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
        status: titleCaseEnum(load.status),
        shipper: load.shipper.companyName,
        carrier: load.carrier?.companyName ?? "No carrier",
        lastEventAt: lastAt ? formatDate(lastAt) : null,
        hoursStale: hoursAgo,
      });
    }
    return stale.sort((a, b) => b.hoursStale - a.hoursStale);
  } catch {
    return [];
  }
}

function getSampleEmailEventDashboardView(): EmailEventDashboardView {
  return buildEmailDashboard(
    [
      {
        id: "sample-email-sent",
        company: "Southline Foods",
        contact: "Erica Walsh",
        subject: "Freight quote: Savannah, GA to Nashville, TN",
        recipient: "erica@southline.example",
        status: "SENT",
        outcome: "Sent via RESEND (sample-email-southline)",
        detail:
          "Quote email sent. Delivery webhooks will replace sample data once Resend is configured.",
        provider: "RESEND",
        messageId: "sample-email-southline",
        eventId: "Not recorded",
        time: "Today",
      },
      {
        id: "sample-email-delivered",
        company: "Peachtree Building Supply",
        contact: "Mason Keller",
        subject: "Quote email delivered",
        recipient: "mason@peachtree.example",
        status: "DELIVERED",
        outcome: "Delivered by Resend.",
        detail:
          "Event: email.delivered\nEmail ID: sample-email-peachtree\nTo: mason@peachtree.example\nSubject: Freight quote: Atlanta, GA to Dallas, TX",
        provider: "RESEND",
        messageId: "sample-email-peachtree",
        eventId: "sample-event-delivered",
        time: "Today",
      },
      {
        id: "sample-email-bounced",
        company: "North Metro Packaging",
        contact: "Chris Duarte",
        subject: "Quote email bounced",
        recipient: "chris@northmetro.example",
        status: "BOUNCED",
        outcome: "Bounced by Resend. Type: hard. Reason: Mailbox unavailable",
        detail:
          "Event: email.bounced\nEmail ID: sample-email-north-metro\nTo: chris@northmetro.example\nSubject: Freight quote follow-up",
        provider: "RESEND",
        messageId: "sample-email-north-metro",
        eventId: "sample-event-bounced",
        time: "Yesterday",
      },
    ],
    [
      {
        id: "sample-suppression",
        email: "chris@northmetro.example",
        reason: "BOUNCED",
        sourceProvider: "RESEND",
        messageId: "sample-email-north-metro",
        eventId: "sample-event-bounced",
        notes: "Suppressed after Resend bounce.",
        lastEvent: "Yesterday",
      },
    ],
  );
}

function buildEmailDashboard(
  events: EmailEventView[],
  suppressions: EmailSuppressionView[] = [],
): EmailEventDashboardView {
  const sentCount = countEmailEvents(events, "SENT");
  const deliveredCount = countEmailEvents(events, "DELIVERED");
  const bouncedCount = countEmailEvents(events, "BOUNCED");
  const complainedCount = countEmailEvents(events, "COMPLAINED");
  const unknownCount = countEmailEvents(events, "UNKNOWN");
  const exceptionCount = bouncedCount + complainedCount;
  const deliveryRate = sentCount
    ? `${Math.round((deliveredCount / sentCount) * 100)}%`
    : deliveredCount
      ? "Webhook only"
      : "0%";

  return {
    sentCount,
    deliveredCount,
    bouncedCount,
    complainedCount,
    unknownCount,
    suppressedCount: suppressions.length,
    exceptionCount,
    deliveryRate,
    webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    events,
    exceptions: events.filter((event) =>
      ["BOUNCED", "COMPLAINED"].includes(event.status),
    ),
    suppressions,
  };
}

function countEmailEvents(events: EmailEventView[], status: EmailEventStatus) {
  return events.filter((event) => event.status === status).length;
}

function getEmailEventStatus(
  subject: string | null,
  outcome: string | null,
): EmailEventStatus {
  const text = `${subject ?? ""} ${outcome ?? ""}`.toLowerCase();

  if (text.includes("complaint") || text.includes("complained")) {
    return "COMPLAINED";
  }

  if (text.includes("bounce")) {
    return "BOUNCED";
  }

  if (text.includes("delivered")) {
    return "DELIVERED";
  }

  if (text.includes("sent via resend")) {
    return "SENT";
  }

  return "UNKNOWN";
}

function extractRecipient(body: string | null) {
  if (!body) {
    return null;
  }

  const match = body.match(/^To:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export async function getActivityViews(): Promise<ActivityView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return activities;
  }

  try {
    const records = await prisma.activity.findMany({
      include: {
        shipper: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (!records.length) {
      return activities;
    }

    return records.map((activity) => ({
      company: activity.shipper?.companyName ?? "Unknown shipper",
      type: titleCaseEnum(activity.type),
      detail: activity.body ?? activity.subject ?? "Activity recorded.",
      time: formatFollowUp(activity.createdAt),
    }));
  } catch {
    return activities;
  }
}

export async function getEmailEventDashboardView(): Promise<EmailEventDashboardView> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleEmailEventDashboardView();
  }

  try {
    const [records, suppressionRecords] = await Promise.all([
      prisma.activity.findMany({
        where: {
          type: "EMAIL",
          externalProvider: "RESEND",
        },
        include: {
          shipper: true,
          contact: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.emailSuppression.findMany({
        orderBy: { lastEventAt: "desc" },
        take: 100,
      }),
    ]);

    if (!records.length && !suppressionRecords.length) {
      return getSampleEmailEventDashboardView();
    }

    const events = records.map((activity) => {
      const status = getEmailEventStatus(activity.subject, activity.outcome);
      const recipient =
        extractRecipient(activity.body) ?? activity.contact?.email ?? "Unknown";

      return {
        id: activity.id,
        company: activity.shipper?.companyName ?? "Unknown shipper",
        contact: formatContactName(activity.contact),
        subject: activity.subject ?? "Quote email event",
        recipient,
        status,
        outcome: activity.outcome ?? "No provider outcome recorded.",
        detail: activity.body ?? "No email event detail recorded.",
        provider: activity.externalProvider ?? "RESEND",
        messageId: activity.externalMessageId ?? "Not recorded",
        eventId: activity.externalEventId ?? "Not recorded",
        time: formatFollowUp(activity.createdAt),
      };
    });

    const suppressions = suppressionRecords.map((suppression) => ({
      id: suppression.id,
      email: suppression.email,
      reason: suppression.reason,
      sourceProvider: suppression.sourceProvider,
      messageId: suppression.messageId ?? "Not recorded",
      eventId: suppression.sourceEventId ?? "Not recorded",
      notes: suppression.notes ?? "No suppression notes recorded.",
      lastEvent: formatFollowUp(suppression.lastEventAt),
    }));

    return buildEmailDashboard(events, suppressions);
  } catch {
    return getSampleEmailEventDashboardView();
  }
}

export async function getShipperViews(): Promise<ShipperView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return shippers;
  }

  try {
    const records = await prisma.shipper.findMany({
      include: {
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    if (!records.length) {
      return shippers;
    }

    return records.map((shipper) => {
      const primary = shipper.contacts[0];

      return {
        id: shipper.id,
        company: shipper.companyName,
        status: titleCaseEnum(shipper.status),
        industry: shipper.industry ?? "Industry needed",
        primaryContact: formatContactName(primary),
        email: primary?.email ?? "No email",
        phone: primary?.phone ?? "No phone",
        lanes: splitList(extractField(shipper.notes ?? "", "Lanes")),
        notes: shipper.notes ?? "No notes yet.",
      };
    });
  } catch {
    return shippers;
  }
}

export async function getShipperDetailView(
  id: string,
): Promise<ShipperDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleShipperDetailView(id);
  }

  try {
    const shipper = await prisma.shipper.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        leads: { include: { contact: true }, orderBy: { updatedAt: "desc" } },
        quoteRequests: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" }, take: 8 },
        loads: {
          include: {
            carrier: true,
            documents: true,
            events: { orderBy: { occurredAt: "desc" } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!shipper) {
      return getSampleShipperDetailView(id);
    }

    const primary = shipper.contacts[0];
    return {
      id: shipper.id,
      company: shipper.companyName,
      status: titleCaseEnum(shipper.status),
      industry: shipper.industry ?? "Industry needed",
      primaryContact: formatContactName(primary),
      email: primary?.email ?? "No email",
      phone: primary?.phone ?? "No phone",
      lanes: splitList(extractField(shipper.notes ?? "", "Lanes")),
      notes: shipper.notes ?? "No notes yet.",
      rawNotes: shipper.notes ?? "",
      contacts: shipper.contacts.map((c) => ({
        id: c.id,
        fullName: formatContactName(c),
        title: c.title ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        isPrimary: c.isPrimary,
      })),
      leads: shipper.leads.map((lead) => {
        const notes = `${shipper.notes ?? ""}\n${lead.notes ?? ""}`;
        return {
          id: lead.id,
          company: shipper.companyName,
          contact: formatContactName(lead.contact),
          title: lead.contact?.title ?? "Contact",
          phone: lead.contact?.phone ?? "No phone",
          email: lead.contact?.email ?? "No email",
          stage: titleCaseEnum(lead.stage),
          source: titleCaseEnum(lead.source),
          priority: formatPriority(lead.priority),
          lanes: extractField(notes, "Lanes") ?? "Lane details needed",
          equipment: extractField(notes, "Equipment") ?? "Equipment needed",
          volume: extractField(notes, "Volume") ?? "Volume unknown",
          nextFollowUp: lead.nextFollowUpAt
            ? formatFollowUp(lead.nextFollowUpAt)
            : "No follow-up set",
          pain: extractField(notes, "Pain") ?? lead.notes ?? "Needs qualification.",
          aiNextAction: lead.notes ?? "Qualify next action.",
        };
      }),
      quoteRequests: shipper.quoteRequests.map((request) =>
        mapQuoteRequest(request, shipper.companyName),
      ),
      loads: shipper.loads.map((load) =>
        mapLoad({ ...load, shipper, events: load.events }),
      ),
      documents: shipper.documents.map(mapDocumentSummary),
    };
  } catch {
    return getSampleShipperDetailView(id);
  }
}

export async function getQuoteRequestViews(): Promise<QuoteRequestView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return quoteRequests;
  }

  try {
    const records = await prisma.quoteRequest.findMany({
      include: {
        shipper: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (!records.length) {
      return quoteRequests;
    }

    return records.map((request) =>
      mapQuoteRequest(request, request.shipper.companyName),
    );
  } catch {
    return quoteRequests;
  }
}

export async function getCustomerQuoteRequestViews(shipperId: string): Promise<QuoteRequestView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  try {
    const records = await prisma.quoteRequest.findMany({
      where: { shipperId },
      include: {
        shipper: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!records.length) {
      return [];
    }

    return records.map((request) =>
      mapQuoteRequest(request, request.shipper.companyName),
    );
  } catch {
    return [];
  }
}

export async function getQuoteRequestDetailView(
  id: string,
): Promise<QuoteRequestDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleQuoteRequestDetailView(id);
  }

  try {
    const request = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        shipper: true,
        contact: true,
        rateBenchmarks: {
          orderBy: { createdAt: "desc" },
        },
        pricingRecommendations: {
          orderBy: { createdAt: "desc" },
        },
        customerQuotes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!request) {
      return getSampleQuoteRequestDetailView(id);
    }

    const customerQuotes = request.customerQuotes.map((quote) => ({
      id: quote.id,
      quotedRate: Number(quote.quotedRate),
      targetCarrierCost:
        quote.targetCarrierCost === null ? null : Number(quote.targetCarrierCost),
      projectedGrossProfit:
        quote.projectedGrossProfit === null
          ? null
          : Number(quote.projectedGrossProfit),
      marginPercent:
        quote.marginPercent === null ? null : Number(quote.marginPercent),
      status: titleCaseEnum(quote.status),
      validUntil: quote.validUntil ? formatFollowUp(quote.validUntil) : "Not set",
      created: formatFollowUp(quote.createdAt),
    }));
    const laneHistory = await prisma.load.findMany({
      where: {
        originCity: { equals: request.originCity, mode: "insensitive" },
        originState: request.originState,
        destinationCity: { equals: request.destinationCity, mode: "insensitive" },
        destinationState: request.destinationState,
        equipmentType: { equals: request.equipmentType, mode: "insensitive" },
      },
      orderBy: { pickupDate: "desc" },
      take: 8,
    });

    return {
      ...mapQuoteRequest(request, request.shipper.companyName),
      contact: formatContactName(request.contact),
      email: request.contact?.email ?? "No email",
      phone: request.contact?.phone ?? "No phone",
      specialRequirements:
        request.specialRequirements ?? request.commodity ?? "No details yet.",
      latestQuote: customerQuotes[0] ?? null,
      customerQuotes,
      rateBenchmarks: request.rateBenchmarks.map((benchmark) => ({
        id: benchmark.id,
        source: titleCaseEnum(benchmark.source),
        sourceLabel: benchmark.sourceLabel ?? titleCaseEnum(benchmark.source),
        lowRate:
          benchmark.lowRate === null ? null : Number(benchmark.lowRate),
        highRate:
          benchmark.highRate === null ? null : Number(benchmark.highRate),
        averageRate: Number(benchmark.averageRate),
        confidence:
          benchmark.confidence === null ? null : Number(benchmark.confidence),
        notes: benchmark.notes ?? "No benchmark notes.",
        created: formatFollowUp(benchmark.createdAt),
      })),
      pricingRecommendations: request.pricingRecommendations.map(
        (recommendation) => ({
          id: recommendation.id,
          source: titleCaseEnum(recommendation.source),
          recommendedCarrierCost: Number(recommendation.recommendedCarrierCost),
          recommendedCustomerRate: Number(
            recommendation.recommendedCustomerRate,
          ),
          projectedGrossProfit: Number(recommendation.projectedGrossProfit),
          marginPercent: Number(recommendation.marginPercent),
          targetMarginPercent:
            recommendation.targetMarginPercent === null
              ? null
              : Number(recommendation.targetMarginPercent),
          riskLevel: recommendation.riskLevel ?? "Not set",
          validForHours: recommendation.validForHours,
          summary: recommendation.summary ?? "No recommendation summary.",
          notes: recommendation.notes ?? "No recommendation notes.",
          created: formatFollowUp(recommendation.createdAt),
        }),
      ),
      marketRateProviders: getMarketRateProviderReadiness(),
      laneHistory: laneHistory.map((load) => {
        const customerRate = Number(load.customerRate);
        const carrierRate =
          load.carrierRate === null ? 0 : Number(load.carrierRate);
        const margin =
          load.grossProfit === null || load.grossProfit === undefined
            ? customerRate - carrierRate
            : Number(load.grossProfit);

        return {
          id: load.id,
          customerRate,
          carrierRate,
          margin,
          marginPercent: customerRate
            ? Number(((margin / customerRate) * 100).toFixed(1))
            : 0,
          pickup: load.pickupDate ? formatDate(load.pickupDate) : "Not set",
          status: titleCaseEnum(load.status),
        };
      }),
    };
  } catch {
    return getSampleQuoteRequestDetailView(id);
  }
}

export async function getCarrierViews(): Promise<CarrierView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return carriers;
  }

  try {
    const records = await prisma.carrier.findMany({
      include: {
        loads: {
          select: {
            id: true,
            status: true,
            grossProfit: true,
            customerRate: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    if (!records.length) {
      return carriers;
    }

    return records.map((carrier) => ({
      id: carrier.id,
      company: carrier.companyName,
      mcNumber: carrier.mcNumber ?? "MC needed",
      dotNumber: carrier.dotNumber ?? "DOT needed",
      contact: carrier.contactName ?? "Dispatch",
      phone: carrier.phone ?? "No phone",
      email: carrier.email ?? "No email",
      complianceStatus: titleCaseEnum(carrier.complianceStatus),
      authorityStatus: carrier.authorityStatus ?? "Authority check needed",
      insuranceStatus: carrier.insuranceStatus ?? "Insurance check needed",
      safetyRating: carrier.safetyRating ?? "Safety rating needed",
      fraudRiskLevel: carrier.fraudRiskLevel ?? "Fraud check needed",
      lastVettedAt: carrier.lastVettedAt
        ? formatDate(carrier.lastVettedAt)
        : "Not vetted",
      approvedBy: carrier.approvedBy ?? "Not approved",
      complianceNotes: carrier.complianceNotes ?? "No compliance notes yet.",
      insuranceExpiration: carrier.insuranceExpiration ? formatDate(carrier.insuranceExpiration) : undefined,
      w9ReceivedAt: carrier.w9ReceivedAt ? formatDate(carrier.w9ReceivedAt) : undefined,
      agreementSignedAt: carrier.agreementSignedAt ? formatDate(carrier.agreementSignedAt) : undefined,
      paymentSetup: carrier.paymentSetup ?? undefined,
      callbackVerifiedAt: carrier.callbackVerifiedAt ? formatDate(carrier.callbackVerifiedAt) : undefined,
      blockedReason: carrier.blockedReason ?? undefined,
      additionalContacts: carrier.additionalContacts ?? undefined,
      preferredLanes: Array.isArray(carrier.preferredLanes)
        ? carrier.preferredLanes.map(String)
        : ["Lane history needed"],
      notes: carrier.notes ?? "No notes yet.",
      loadCount: carrier.loads.length,
      deliveredLoads: carrier.loads.filter((l) => l.status === "DELIVERED")
        .length,
      avgMargin: (() => {
        const withGP = carrier.loads.filter(
          (l) => l.grossProfit !== null && Number(l.customerRate) > 0,
        );
        if (!withGP.length) return 0;
        const avg =
          withGP.reduce(
            (sum, l) =>
              sum +
              (Number(l.grossProfit) / Number(l.customerRate)) * 100,
            0,
          ) / withGP.length;
        return Number(avg.toFixed(1));
      })(),
      // Phase 3.2: Simple performance scorecard (safe fields from list include)
      onTimePickupRate: (() => {
        if (!carrier.loads.length) return null;
        const onTime = carrier.loads.filter(
          (l) => l.status === "DELIVERED" || l.status === "POD_RECEIVED"
        ).length;
        return Math.round((onTime / carrier.loads.length) * 100);
      })(),
      issuesCount: (carrier.blockedReason ? 1 : 0),
    }));
  } catch {
    return carriers;
  }
}

export async function getCarrierDetailView(
  id: string,
): Promise<CarrierDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleCarrierDetailView(id);
  }

  try {
    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { createdAt: "desc" }, take: 8 },
        loads: {
          include: {
            shipper: true,
            carrier: true,
            documents: true,
            events: true,
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!carrier) {
      return getSampleCarrierDetailView(id);
    }

    return {
      id: carrier.id,
      company: carrier.companyName,
      mcNumber: carrier.mcNumber ?? "MC needed",
      dotNumber: carrier.dotNumber ?? "DOT needed",
      contact: carrier.contactName ?? "Dispatch",
      phone: carrier.phone ?? "No phone",
      email: carrier.email ?? "No email",
      complianceStatus: titleCaseEnum(carrier.complianceStatus),
      authorityStatus: carrier.authorityStatus ?? "Authority check needed",
      insuranceStatus: carrier.insuranceStatus ?? "Insurance check needed",
      safetyRating: carrier.safetyRating ?? "Safety rating needed",
      fraudRiskLevel: carrier.fraudRiskLevel ?? "Fraud check needed",
      lastVettedAt: carrier.lastVettedAt
        ? formatDate(carrier.lastVettedAt)
        : "Not vetted",
      approvedBy: carrier.approvedBy ?? "Not approved",
      complianceNotes: carrier.complianceNotes ?? "No compliance notes yet.",
      insuranceExpiration: carrier.insuranceExpiration ? formatDate(carrier.insuranceExpiration) : undefined,
      w9ReceivedAt: carrier.w9ReceivedAt ? formatDate(carrier.w9ReceivedAt) : undefined,
      agreementSignedAt: carrier.agreementSignedAt ? formatDate(carrier.agreementSignedAt) : undefined,
      paymentSetup: carrier.paymentSetup ?? undefined,
      callbackVerifiedAt: carrier.callbackVerifiedAt ? formatDate(carrier.callbackVerifiedAt) : undefined,
      blockedReason: carrier.blockedReason ?? undefined,
      additionalContacts: carrier.additionalContacts ?? undefined,
      preferredLanes: Array.isArray(carrier.preferredLanes)
        ? carrier.preferredLanes.map(String)
        : ["Lane history needed"],
      notes: carrier.notes ?? "No notes yet.",
      loadCount: carrier.loads.length,
      deliveredLoads: carrier.loads.filter((l) => l.status === "DELIVERED")
        .length,
      avgMargin: (() => {
        const withGP = carrier.loads.filter(
          (l) =>
            l.grossProfit !== null &&
            l.grossProfit !== undefined &&
            Number(l.customerRate) > 0,
        );
        if (!withGP.length) return 0;
        const avg =
          withGP.reduce(
            (sum, l) =>
              sum +
              (Number(l.grossProfit) / Number(l.customerRate)) * 100,
            0,
          ) / withGP.length;
        return Number(avg.toFixed(1));
      })(),
      // Phase 3.2: Simple performance scorecard (using full load include in detail)
      onTimePickupRate: (() => {
        if (!carrier.loads.length) return null;
        const onTime = carrier.loads.filter(
          (l) => l.status === "DELIVERED" || l.status === "POD_RECEIVED"
        ).length;
        return Math.round((onTime / carrier.loads.length) * 100);
      })(),
      issuesCount: (carrier.blockedReason ? 1 : 0) + carrier.loads.filter((l) => l.status === "IN_TRANSIT").length,
      loads: carrier.loads.map((load) => mapLoad(load)),
      documents: carrier.documents.map(mapDocumentSummary),
    };
  } catch {
    return getSampleCarrierDetailView(id);
  }
}

export async function getLoadViews(): Promise<LoadView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return loads;
  }

  try {
    const records = await prisma.load.findMany({
      include: {
        shipper: true,
        carrier: true,
        invoice: true,
        documents: true,
        carrierQuotes: {
          include: { carrier: true },
          orderBy: { createdAt: "desc" },
        },
        sourcingCandidates: {
          include: { carrier: true },
          orderBy: [{ status: "asc" }, { matchScore: "desc" }, { createdAt: "desc" }],
        },
        integrationLogs: {
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        events: {
          orderBy: { occurredAt: "desc" },
          take: 1,
        },
        exceptions: {
          include: { owner: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        publicTrackingLinks: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ pickupDate: "asc" }, { updatedAt: "desc" }],
      take: 100,
    });

    if (!records.length) {
      return loads;
    }

    return records.map((load) => mapLoad(load));
  } catch {
    return loads;
  }
}

export type TrackingRiskGroup = {
  title: string;
  description: string;
  loads: LoadView[];
};

export async function getTrackingWorkspaceView(): Promise<{
  groups: TrackingRiskGroup[];
  totalActive: number;
}> {
  const loads = await getLoadViews();

  // Focus on in-flight loads that need monitoring
  const activeLoads = loads.filter((l) =>
    ["TENDERED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(enumKey(l.status)) ||
    (enumKey(l.status) === "INVOICED" && !l.invoice?.paidAt)
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const groups: TrackingRiskGroup[] = [];

  // Pickup today
  const pickupToday = activeLoads.filter((l) => {
    if (!l.rawPickupDate) return false;
    const d = new Date(l.rawPickupDate);
    return d >= todayStart && d < todayEnd && !["PICKED_UP", "IN_TRANSIT", "DELIVERED", "POD_RECEIVED", "INVOICED", "PAID"].includes(enumKey(l.status));
  });
  if (pickupToday.length) {
    groups.push({
      title: "Pickup today",
      description: "Loads scheduled for pickup today that are not yet in transit",
      loads: pickupToday,
    });
  }

  // Delivery today
  const deliveryToday = activeLoads.filter((l) => {
    if (!l.rawDeliveryDate) return false;
    const d = new Date(l.rawDeliveryDate);
    return d >= todayStart && d < todayEnd && !["DELIVERED", "POD_RECEIVED", "INVOICED", "PAID"].includes(enumKey(l.status));
  });
  if (deliveryToday.length) {
    groups.push({
      title: "Delivery today",
      description: "Loads scheduled for delivery today without final status",
      loads: deliveryToday,
    });
  }

  // No recent check call / update (proxy: no events or stale customer update >24h)
  const noRecent = activeLoads.filter((l) => {
    if (l.events.length === 0) return true;
    if (!l.lastCustomerUpdateAt) return true;
    const last = new Date(l.lastCustomerUpdateAt);
    return now.getTime() - last.getTime() > 24 * 60 * 60 * 1000;
  });
  if (noRecent.length) {
    groups.push({
      title: "No recent check call / update",
      description: "Loads without recent activity or customer update in the last 24 hours",
      loads: noRecent,
    });
  }

  // Customer update due
  const customerUpdateDue = activeLoads.filter((l) => enumKey(l.customerUpdateStatus ?? "") === "NEEDED");
  if (customerUpdateDue.length) {
    groups.push({
      title: "Customer update due",
      description: "Loads where a customer update has been flagged as needed",
      loads: customerUpdateDue,
    });
  }

  // Delivered but missing POD
  const missingPod = activeLoads.filter((l) =>
    ["DELIVERED", "INVOICED"].includes(enumKey(l.status)) && !l.hasPod
  );
  if (missingPod.length) {
    groups.push({
      title: "Delivered but missing POD",
      description: "Loads marked delivered or invoiced without a POD document",
      loads: missingPod,
    });
  }

  // Late pickup / delivery risk
  const lateRisk = activeLoads.filter((l) => {
    const status = enumKey(l.status);
    if (l.rawPickupDate && new Date(l.rawPickupDate) < now && !["PICKED_UP", "IN_TRANSIT", "DELIVERED", "POD_RECEIVED", "INVOICED", "PAID"].includes(status)) {
      return true;
    }
    if (l.rawDeliveryDate && new Date(l.rawDeliveryDate) < now && !["DELIVERED", "POD_RECEIVED", "INVOICED", "PAID"].includes(status)) {
      return true;
    }
    return false;
  });
  if (lateRisk.length) {
    groups.push({
      title: "Late pickup / delivery risk",
      description: "Loads past their scheduled date without corresponding status progression",
      loads: lateRisk,
    });
  }

  // Uncovered or not booked (still tendered without carrier)
  const uncovered = activeLoads.filter((l) => enumKey(l.status) === "TENDERED" && l.carrier === "Carrier needed");
  if (uncovered.length) {
    groups.push({
      title: "Uncovered / not booked",
      description: "Tendered loads that still need a carrier assigned",
      loads: uncovered,
    });
  }

  return {
    groups,
    totalActive: activeLoads.length,
  };
}

export async function generatePublicTrackingLink(loadId: string): Promise<{ url: string; expiresAt: string }> {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    throw new Error("Load not found.");
  }

  const token = `trk_${randomBytes(32).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.publicTrackingLink.create({
    data: {
      loadId,
      token,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    url: `${baseUrl}/track/${token}`,
    expiresAt: formatFollowUp(expiresAt),
  };
}

export async function getPublicLoadView(token: string): Promise<{
  loadNumber: string;
  lane: string;
  status: string;
  pickup?: string;
  delivery?: string;
  events: Array<{ type: string; message: string; time: string }>;
  hasPod: boolean;
  podDownloadHref?: string | null;
} | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  const link = await prisma.publicTrackingLink.findUnique({
    where: { token },
    include: {
      load: {
        include: {
          events: {
            orderBy: { occurredAt: "desc" },
            take: 5,
          },
          documents: true,
        },
      },
    },
  });

  if (!link || link.revoked || link.expiresAt < new Date()) {
    return null;
  }

  const l = link.load;
  const hasPod = l.documents.some((d: { type: string }) => d.type === "POD");
  const podDoc = l.documents.find((d: { type: string; id: string }) => d.type === "POD");
  const podDownloadHref = podDoc ? `/api/documents/${podDoc.id}/download` : null;

  return {
    loadNumber: l.loadNumber ? `LD-${String(l.loadNumber).padStart(4, "0")}` : "LD-????",
    lane: `${l.originCity}, ${l.originState} → ${l.destinationCity}, ${l.destinationState}`,
    status: titleCaseEnum(l.status),
    pickup: l.pickupDate ? formatDate(l.pickupDate) : undefined,
    delivery: l.deliveryDate ? formatDate(l.deliveryDate) : undefined,
    events: l.events.map((e: { type: string; message: string; occurredAt: Date }) => ({
      type: titleCaseEnum(e.type),
      message: e.message,
      time: formatFollowUp(e.occurredAt),
    })),
    hasPod,
    podDownloadHref,
  };
}

export async function getLoadDetailView(
  id: string,
): Promise<LoadDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleLoadDetailView(id);
  }

  try {
    const load = await prisma.load.findUnique({
      where: { id },
      include: {
        shipper: true,
        carrier: true,
        invoice: true,
        carrierQuotes: {
          include: { carrier: true },
          orderBy: { createdAt: "desc" },
        },
        sourcingCandidates: {
          include: { carrier: true },
          orderBy: [{ status: "asc" }, { matchScore: "desc" }, { createdAt: "desc" }],
        },
        integrationLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        events: {
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        exceptions: {
          include: { owner: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        publicTrackingLinks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!load) {
      return getSampleLoadDetailView(id);
    }

    return mapLoad(load);
  } catch {
    return getSampleLoadDetailView(id);
  }
}

export async function getDocumentCenterViews(): Promise<DocumentCenterView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  try {
    const documents = await prisma.document.findMany({
      include: {
        shipper: { select: { id: true, companyName: true } },
        load: {
          select: {
            id: true,
            loadNumber: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
          },
        },
        quoteRequest: {
          select: {
            id: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
          },
        },
        carrier: { select: { id: true, companyName: true } },
        savingsAudit: { select: { id: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    return documents.map((document) => {
      const summary = mapDocumentSummary(document);
      const related = getDocumentRelatedRecord(document);

      return {
        ...summary,
        relatedLabel: related.label,
        relatedHref: related.href,
        shipper: document.shipper?.companyName ?? "No shipper linked",
        uploadedBy: document.uploadedBy?.name ?? "System or public intake",
      };
    });
  } catch {
    return [];
  }
}

export async function getRecentAiAgentRunViews(): Promise<AiAgentRunView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleAiAgentRunViews();
  }

  try {
    const runs = await prisma.aiAgentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    if (!runs.length) {
      return [];
    }

    return runs.map(mapAiAgentRun);
  } catch {
    return [];
  }
}

export async function getAiCommandCenterView(): Promise<AiCommandCenterView> {
  if (!hasDatabaseUrl() || !prisma) {
    const sampleRuns = getSampleAiAgentRunViews();

    return {
      metrics: {
        total: sampleRuns.length.toString(),
        needsApproval: "1",
        failed: "0",
        completed: "0",
        averageConfidence: "50%",
      },
      dailyBrief: getSampleDailyBrief(),
      exceptions: getSampleAiExceptions(),
      approvalQueue: sampleRuns,
      failedRuns: [],
      recentRuns: sampleRuns,
      promptHistory: [],
    };
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [
      runs,
      overdueLeadCount,
      openQuoteCount,
      activeLoadCount,
      overdueLeads,
      pricingQuotes,
      uncoveredLoads,
      customerUpdateLoads,
      podLoads,
      complianceCarriers,
    ] = await Promise.all([
      prisma.aiAgentRun.findMany({
        orderBy: { createdAt: "desc" },
        include: { approvedBy: true, rejectedBy: true },
        take: 100,
      }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: { lte: now },
          stage: { notIn: ["WON", "LOST"] },
        },
      }),
      prisma.quoteRequest.count({
        where: { status: { in: ["NEW", "PRICING"] } },
      }),
      prisma.load.count({
        where: {
          status: {
            in: ["TENDERED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"],
          },
        },
      }),
      prisma.lead.findMany({
        where: {
          nextFollowUpAt: { lte: now },
          stage: { notIn: ["WON", "LOST"] },
        },
        include: { shipper: true, contact: true },
        orderBy: [{ priority: "asc" }, { nextFollowUpAt: "asc" }],
        take: 5,
      }),
      prisma.quoteRequest.findMany({
        where: {
          status: { in: ["NEW", "PRICING"] },
          OR: [{ pickupDate: null }, { pickupDate: { lte: tomorrow } }],
        },
        include: { shipper: true },
        orderBy: [{ pickupDate: "asc" }, { createdAt: "asc" }],
        take: 5,
      }),
      prisma.load.findMany({
        where: {
          carrierId: null,
          status: { in: ["TENDERED", "BOOKED"] },
        },
        include: { shipper: true },
        orderBy: [{ pickupDate: "asc" }, { createdAt: "asc" }],
        take: 5,
      }),
      prisma.load.findMany({
        where: {
          customerUpdateStatus: "NEEDED",
          status: { in: ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] },
        },
        include: { shipper: true },
        orderBy: [{ pickupDate: "asc" }, { updatedAt: "asc" }],
        take: 5,
      }),
      prisma.load.findMany({
        where: {
          status: "DELIVERED",
          documents: { none: { type: "POD" } },
        },
        include: { shipper: true },
        orderBy: [{ deliveryDate: "asc" }, { updatedAt: "asc" }],
        take: 5,
      }),
      prisma.carrier.findMany({
        where: { complianceStatus: { in: ["PENDING", "EXPIRED", "REJECTED"] } },
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
      }),
    ]);
    const promptHistory = await getAgentPromptVersionViews(12);
    const views = runs.map(mapAiAgentRun);
    const confidenceValues = runs
      .map((run) => (run.confidence === null ? null : Number(run.confidence)))
      .filter((value): value is number => value !== null);
    const failedRuns = runs.filter((run) => run.status === "FAILED");
    const approvalRuns = runs.filter(
      (run) => run.status === "NEEDS_HUMAN_APPROVAL",
    );
    const averageConfidence = confidenceValues.length
      ? `${Math.round(
          (confidenceValues.reduce((total, value) => total + value, 0) /
            confidenceValues.length) *
            100,
        )}%`
      : "n/a";

    return {
      metrics: {
        total: runs.length.toString(),
        needsApproval: approvalRuns.length.toString(),
        failed: failedRuns.length.toString(),
        completed: runs
          .filter((run) => run.status === "COMPLETED")
          .length.toString(),
        averageConfidence,
      },
      dailyBrief: [
        {
          label: "Lead follow-ups due",
          value: overdueLeadCount.toString(),
          detail: "Sales should clear these before new prospecting.",
          href: "/leads",
          tone: overdueLeadCount ? "warning" : "default",
        },
        {
          label: "Quotes needing pricing",
          value: openQuoteCount.toString(),
          detail: "Review DAT/Truckstop benchmarks before quoting customers.",
          href: "/quote-requests",
          tone: openQuoteCount ? "warning" : "default",
        },
        {
          label: "Active loads",
          value: activeLoadCount.toString(),
          detail: "Watch coverage, tracking, POD, and billing readiness.",
          href: "/loads",
          tone: activeLoadCount ? "default" : "warning",
        },
        {
          label: "AI approval backlog",
          value: approvalRuns.length.toString(),
          detail: "Approve useful output before expanding automation.",
          href: "/agents",
          tone: approvalRuns.length ? "warning" : "default",
        },
      ],
      exceptions: [
        ...overdueLeads.map((lead) => ({
          id: `lead-${lead.id}`,
          type: "Sales follow-up",
          severity: "High" as const,
          title: lead.shipper.companyName,
          detail: `${formatContactName(lead.contact)} was due ${
            lead.nextFollowUpAt
              ? formatFollowUp(lead.nextFollowUpAt)
              : "before today"
          }.`,
          href: `/leads/${lead.id}`,
        })),
        ...pricingQuotes.map((quote) => ({
          id: `quote-${quote.id}`,
          type: "Pricing",
          severity: "High" as const,
          title: `${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState}`,
          detail: `${quote.shipper.companyName} needs a ${titleCaseEnum(
            quote.status,
          ).toLowerCase()} quote priced.`,
          href: `/quote-requests/${quote.id}`,
        })),
        ...uncoveredLoads.map((load) => ({
          id: `coverage-${load.id}`,
          type: "Carrier coverage",
          severity: "High" as const,
          title: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
          detail: `${load.shipper.companyName} has no assigned carrier.`,
          href: `/loads/${load.id}`,
        })),
        ...customerUpdateLoads.map((load) => ({
          id: `customer-update-${load.id}`,
          type: "Customer update",
          severity: "Medium" as const,
          title: `${load.shipper.companyName} update needed`,
          detail: `${titleCaseEnum(load.status)} load needs a customer status update.`,
          href: `/loads/${load.id}`,
        })),
        ...podLoads.map((load) => ({
          id: `pod-${load.id}`,
          type: "POD",
          severity: "Medium" as const,
          title: `${load.shipper.companyName} missing POD`,
          detail: "Delivered load cannot move cleanly to billing without POD.",
          href: `/loads/${load.id}`,
        })),
        ...complianceCarriers.map((carrier) => ({
          id: `carrier-${carrier.id}`,
          type: "Carrier compliance",
          severity:
            carrier.complianceStatus === "REJECTED"
              ? ("High" as const)
              : ("Medium" as const),
          title: carrier.companyName,
          detail: `Compliance status is ${titleCaseEnum(
            carrier.complianceStatus,
          ).toLowerCase()}.`,
          href: `/carriers/${carrier.id}`,
        })),
        ...failedRuns.slice(0, 5).map((run) => ({
          id: `agent-${run.id}`,
          type: "AI agent",
          severity: "Low" as const,
          title: run.agentName,
          detail: run.errorMessage ?? "Agent failed and can be reviewed.",
          href: "/agents",
        })),
      ].slice(0, 20),
      approvalQueue: views.filter(
        (run) => run.status === "Needs Human Approval",
      ),
      failedRuns: views.filter((run) => run.status === "Failed"),
      recentRuns: views.slice(0, 25),
      promptHistory,
    };
  } catch {
    return {
      metrics: {
        total: "0",
        needsApproval: "0",
        failed: "0",
        completed: "0",
        averageConfidence: "n/a",
      },
      dailyBrief: getSampleDailyBrief(),
      exceptions: [],
      approvalQueue: [],
      failedRuns: [],
      recentRuns: [],
      promptHistory: [],
    };
  }
}

function getSampleAiAgentRunViews(): AiAgentRunView[] {
  return [
    {
      id: "sample-agent-run",
      agentName: "Sales Follow-Up Agent",
      relatedEntityType: "Lead",
      relatedEntityId: "peachtree-building-supply",
      status: "Needs Human Approval",
      confidence: 0.5,
      summary:
        "Sample agent run. Connect XAI_API_KEY and DATABASE_URL to log real agent output.",
      nextAction: "Call the lead, confirm lane details, and log the result.",
      automationMode: "Approve first",
      riskLevel: "Medium",
      approvalRequired: true,
      actionSummary: "Drafts sales follow-up recommendations for human review.",
      promptVersion: 1,
      gatedActions: ["Customer emails", "Customer SMS", "Outbound calls"],
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      created: "Demo",
    },
  ];
}

type AiAgentRunWithReviewer = AiAgentRun & {
  approvedBy?: { name: string } | null;
  rejectedBy?: { name: string } | null;
};

function mapAiAgentRun(run: AiAgentRunWithReviewer): AiAgentRunView {
  const output = parseAgentOutput(run.outputJson);
  const gatedActions = parseGatedActions(run.controlJson);
  const reviewedBy = run.approvedBy?.name ?? run.rejectedBy?.name ?? null;
  const reviewedAt = run.approvedAt ?? run.rejectedAt;

  return {
    id: run.id,
    agentName: run.agentName,
    relatedEntityType: run.relatedEntityType ?? "Unknown",
    relatedEntityId: run.relatedEntityId ?? "",
    status: titleCaseEnum(run.status),
    confidence: run.confidence === null ? null : Number(run.confidence),
    summary:
      output.summary ?? run.errorMessage ?? "Agent run did not return a summary.",
    nextAction: output.nextAction ?? "Review manually.",
    errorMessage: run.errorMessage,
    automationMode: titleCaseEnum(run.automationMode ?? "approve_first"),
    riskLevel: titleCaseEnum(run.riskLevel ?? "medium"),
    approvalRequired: run.approvalRequired,
    actionSummary: run.actionSummary ?? "Review AI output before taking action.",
    promptVersion: run.promptVersion,
    gatedActions,
    reviewNotes: run.reviewNotes,
    reviewedBy,
    reviewedAt: reviewedAt ? formatFollowUp(reviewedAt) : null,
    created: formatFollowUp(run.createdAt),
  };
}

function getSampleDailyBrief(): DailyBriefItemView[] {
  return [
    {
      label: "Lead follow-ups due",
      value: "3",
      detail: "Start with qualified leads and audit submissions.",
      href: "/leads",
      tone: "warning",
    },
    {
      label: "Quotes needing pricing",
      value: "2",
      detail: "Use DAT/Truckstop benchmarks before quoting customers.",
      href: "/quote-requests",
      tone: "warning",
    },
    {
      label: "Active loads",
      value: "4",
      detail: "Watch tracking, POD, and billing readiness.",
      href: "/loads",
      tone: "default",
    },
    {
      label: "AI approval backlog",
      value: "1",
      detail: "Review output before expanding automation.",
      href: "/agents",
      tone: "warning",
    },
  ];
}

function getSampleAiExceptions(): AiExceptionView[] {
  return [
    {
      id: "sample-quote-exception",
      type: "Pricing",
      severity: "High",
      title: "Atlanta, GA -> Dallas, TX",
      detail: "Sample quote needs DAT/Truckstop pricing before customer quote.",
      href: "/quote-requests",
    },
    {
      id: "sample-coverage-exception",
      type: "Carrier coverage",
      severity: "Medium",
      title: "Load needs compliant carrier coverage",
      detail: "Sample load has no assigned carrier yet.",
      href: "/loads",
    },
  ];
}

function getSampleLeadDetailView(id: string): LeadDetailView | null {
  const sample = leads.find((lead) => lead.id === id);

  if (!sample) {
    return null;
  }

  return {
    ...sample,
    activities: activities.filter(
      (activity) => activity.company === sample.company,
    ),
  };
}

function getSampleCommunicationWorkspaceView(): CommunicationWorkspaceView {
  return {
    threads: leads.slice(0, 8).map((lead) => {
      const messages = activities
        .filter((activity) => activity.company === lead.company)
        .map((activity, index) => ({
          id: `sample-message-${lead.id}-${index}`,
          channel: activity.type,
          direction: activity.type === "Note" ? "Internal" : "Outbound",
          subject: activity.type,
          body: activity.detail,
          outcome: "Sample activity.",
          time: activity.time,
        }));
      const latest = messages[0];

      return {
        id: lead.id,
        leadId: lead.id,
        company: lead.company,
        contact: lead.contact,
        title: lead.title,
        phone: lead.phone,
        email: lead.email,
        stage: lead.stage,
        priority: lead.priority,
        lanes: lead.lanes,
        equipment: lead.equipment,
        volume: lead.volume,
        pain: lead.pain,
        nextFollowUp: lead.nextFollowUp,
        aiNextAction: lead.aiNextAction,
        lastMessage: latest?.body ?? "No communication logged yet.",
        lastMessageTime: latest?.time ?? "No activity",
        messages,
        latestAiDraft: null,
      };
    }),
  };
}

function getSampleShipperDetailView(id: string): ShipperDetailView | null {
  const sample = shippers.find((shipper) => shipper.id === id);

  return sample
    ? {
        ...sample,
        rawNotes: sample.notes,
        contacts: [],
        leads: leads.filter((lead) => lead.company === sample.company),
        quoteRequests: quoteRequests.filter(
          (quote) => quote.company === sample.company,
        ),
        loads: loads.filter((load) => load.shipper === sample.company),
        documents: [],
      }
    : null;
}

function getSampleQuoteRequestDetailView(
  id: string,
): QuoteRequestDetailView | null {
  const sample = quoteRequests.find((quote) => quote.id === id);

  return sample
    ? {
        ...sample,
        contact: "Primary contact",
        email: "No email",
        phone: "No phone",
        specialRequirements: sample.details,
        latestQuote: null,
        customerQuotes: [],
        rateBenchmarks: [],
        pricingRecommendations: [],
        marketRateProviders: getMarketRateProviderReadiness(),
        laneHistory: [],
      }
    : null;
}

function getSampleCarrierDetailView(id: string): CarrierDetailView | null {
  const sample = carriers.find((carrier) => carrier.id === id);

  return sample
    ? {
        ...sample,
        loads: loads.filter((load) => load.carrier === sample.company),
        documents: [],
      }
    : null;
}

function getSampleLoadDetailView(id: string): LoadDetailView | null {
  return loads.find((load) => load.id === id) ?? null;
}

function formatContactName(
  contact:
    | {
        firstName: string;
        lastName?: string | null;
      }
    | null
    | undefined,
) {
  if (!contact) {
    return "No contact";
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function enumKey(value: string) {
  return value.toUpperCase().replace(/\s+/g, "_");
}

function formatPriority(priority: number) {
  if (priority <= 1) {
    return "High";
  }

  if (priority <= 3) {
    return "Medium";
  }

  return "Low";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatFollowUp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function extractField(notes: string, field: string) {
  const match = notes.match(new RegExp(`${field}:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.trim();
}

function splitList(value: string | undefined) {
  if (!value) {
    return ["Lane details needed"];
  }

  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapQuoteRequest(
  request: {
    id: string;
    originCity: string;
    originState: string;
    originAddress?: string | null;
    destinationCity: string;
    destinationState: string;
    destinationAddress?: string | null;
    equipmentType: string;
    pickupDate?: Date | null;
    pickupWindow?: string | null;
    deliveryDate?: Date | null;
    deliveryWindow?: string | null;
    weight?: number | null;
    palletCount?: number | null;
    pieceCount?: number | null;
    status: string;
    specialRequirements?: string | null;
    commodity?: string | null;
    dimensions?: string | null;
    hazmat?: boolean;
    temperatureRequirement?: string | null;
    appointmentRequired?: boolean;
    accessorials?: string | null;
    customerReference?: string | null;
    urgency?: string | null;
    targetMarginPercent?: unknown | null;
    pricingNotes?: string | null;
  },
  companyName: string,
) {
  return {
    id: request.id,
    company: companyName,
    lane: `${request.originCity}, ${request.originState} -> ${request.destinationCity}, ${request.destinationState}`,
    equipment: request.equipmentType,
    originCity: request.originCity,
    originState: request.originState,
    destinationCity: request.destinationCity,
    destinationState: request.destinationState,
    originAddress: request.originAddress ?? "Pickup address needed",
    destinationAddress: request.destinationAddress ?? "Delivery address needed",
    pickup: request.pickupDate ? formatDate(request.pickupDate) : "Not set",
    pickupDateInput: request.pickupDate
      ? formatDateInput(request.pickupDate)
      : undefined,
    pickupWindow: request.pickupWindow ?? "Window needed",
    delivery: request.deliveryDate ? formatDate(request.deliveryDate) : "Not set",
    deliveryDateInput: request.deliveryDate
      ? formatDateInput(request.deliveryDate)
      : undefined,
    deliveryWindow: request.deliveryWindow ?? "Window needed",
    weight: request.weight ? `${request.weight.toLocaleString()} lbs` : "Not set",
    commodity: request.commodity ?? "Commodity needed",
    palletCount:
      request.palletCount === null || request.palletCount === undefined
        ? "Not set"
        : request.palletCount.toString(),
    pieceCount:
      request.pieceCount === null || request.pieceCount === undefined
        ? "Not set"
        : request.pieceCount.toString(),
    dimensions: request.dimensions ?? "Not set",
    hazmat: request.hazmat ? "Yes" : "No",
    temperatureRequirement: request.temperatureRequirement ?? "None",
    appointmentRequired: request.appointmentRequired ? "Yes" : "No",
    accessorials: request.accessorials ?? "None",
    customerReference: request.customerReference ?? "Not set",
    urgency: request.urgency ?? "Normal",
    targetMarginPercent:
      request.targetMarginPercent === null ||
      request.targetMarginPercent === undefined
        ? "Not set"
        : `${Number(request.targetMarginPercent)}%`,
    targetMarginPercentInput:
      request.targetMarginPercent === null ||
      request.targetMarginPercent === undefined
        ? undefined
        : String(Number(request.targetMarginPercent)),
    pricingNotes: request.pricingNotes ?? "No pricing notes yet.",
    status: titleCaseEnum(request.status),
    details:
      request.specialRequirements ??
      request.commodity ??
      "Needs freight details before pricing.",
    aiSummary:
      "Validate service requirements, price the lane, then queue carrier coverage.",
  };
}

function mapDocumentSummary(document: {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  status?: string | null;
  source?: string | null;
  extractionStatus?: string | null;
  extractedText?: string | null;
  createdAt: Date;
}): LoadDocumentView {
  const canDownload = !document.fileUrl.startsWith("pending-storage://");

  return {
    id: document.id,
    type: titleCaseEnum(document.type),
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    downloadHref: canDownload ? getDocumentDownloadHref(document.id) : null,
    status: titleCaseEnum(document.status ?? "ACTIVE"),
    source: titleCaseEnum(document.source ?? "MANUAL_UPLOAD"),
    extractionStatus: titleCaseEnum(
      document.extractionStatus ?? "NOT_REQUESTED",
    ),
    mimeType: document.mimeType ?? "Type unknown",
    fileSize: formatFileSize(document.fileSize),
    storageState: document.storageKey
      ? "Stored"
      : canDownload
        ? "Linked"
        : "Missing storage",
    created: formatFollowUp(document.createdAt),
    extractedText: document.extractedText ?? null,
    extractedFields: (document as { extractedFields?: import("@/lib/documents").DocumentStructuredFields | null }).extractedFields ?? null,
  };
}

function getDocumentRelatedRecord(document: {
  shipper?: { id: string; companyName: string } | null;
  load?: {
    id: string;
    loadNumber: number | null;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
  } | null;
  quoteRequest?: {
    id: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
  } | null;
  carrier?: { id: string; companyName: string } | null;
  savingsAudit?: { id: string } | null;
}) {
  if (document.load) {
    return {
      label: `LD-${String(document.load.loadNumber ?? "").padStart(4, "0")} · ${document.load.originCity}, ${document.load.originState} -> ${document.load.destinationCity}, ${document.load.destinationState}`,
      href: `/loads/${document.load.id}?tab=documents`,
    };
  }

  if (document.quoteRequest) {
    return {
      label: `Quote · ${document.quoteRequest.originCity}, ${document.quoteRequest.originState} -> ${document.quoteRequest.destinationCity}, ${document.quoteRequest.destinationState}`,
      href: `/quote-requests/${document.quoteRequest.id}`,
    };
  }

  if (document.shipper) {
    return {
      label: document.shipper.companyName,
      href: `/shippers/${document.shipper.id}`,
    };
  }

  if (document.carrier) {
    return {
      label: document.carrier.companyName,
      href: `/carriers/${document.carrier.id}`,
    };
  }

  if (document.savingsAudit) {
    return {
      label: "Savings audit",
      href: null,
    };
  }

  return {
    label: "Unlinked document",
    href: null,
  };
}

function mapLoad(load: {
  id: string;
  loadNumber?: number | null;
  shipper: { companyName: string };
  carrier?: { companyName: string } | null;
  originCity: string;
  originState: string;
  originAddress?: string | null;
  destinationCity: string;
  destinationState: string;
  destinationAddress?: string | null;
  equipmentType: string;
  commodity?: string | null;
  weight?: number | null;
  palletCount?: number | null;
  pieceCount?: number | null;
  dimensions?: string | null;
  hazmat?: boolean;
  temperatureRequirement?: string | null;
  appointmentRequired?: boolean;
  accessorials?: string | null;
  customerReference?: string | null;
  carrierInvoiceNumber?: string | null;
  carrierPaymentDue?: Date | null;
  carrierPaidAt?: Date | null;
  status: string;
  pickupDate?: Date | null;
  pickupWindow?: string | null;
  deliveryDate?: Date | null;
  deliveryWindow?: string | null;
  customerUpdateStatus?: string;
  lastCustomerUpdateAt?: Date | null;
  rateConfirmationStatus?: string;
  rateConfirmationSentAt?: Date | null;
  rateConfirmationSignedAt?: Date | null;
  customerRate: unknown;
  carrierRate?: unknown | null;
  grossProfit?: unknown | null;
  invoice?: {
    amount: unknown;
    status: string;
    dueDate?: Date | null;
    paidAt?: Date | null;
  } | null;
  carrierQuotes?: Array<{
    id: string;
    carrierId: string;
    carrier: {
      companyName: string;
      complianceStatus: string;
    };
    quotedRate: unknown;
    status: string;
    notes?: string | null;
    createdAt: Date;
  }>;
  sourcingCandidates?: Array<{
    id: string;
    carrierId?: string | null;
    carrier?: {
      complianceStatus: string;
    } | null;
    companyName: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    mcNumber?: string | null;
    dotNumber?: string | null;
    source: string;
    status: string;
    suggestedRate?: unknown | null;
    matchScore?: unknown | null;
    complianceSnapshot?: string | null;
    notes?: string | null;
    createdAt: Date;
  }>;
  integrationLogs?: Array<{
    id: string;
    provider: string;
    action: string;
    status: string;
    message?: string | null;
    error?: string | null;
    createdAt: Date;
  }>;
  events: Array<{
    type: string;
    message: string;
    location?: string | null;
    occurredAt: Date;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    storageKey?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    status?: string | null;
    source?: string | null;
    extractionStatus?: string | null;
    createdAt: Date;
  }>;
  exceptions?: Array<{
    id: string;
    type: string;
    status: string;
    ownerUserId?: string | null;
    owner?: { name: string } | null;
    notes?: string | null;
    resolvedAt?: Date | null;
    createdAt: Date;
  }>;
  publicTrackingLinks?: Array<{
    id: string;
    token: string;
    expiresAt: Date;
    revoked: boolean;
    createdAt: Date;
  }>;
}) {
  const customerRate = Number(load.customerRate);
  const carrierRate = load.carrierRate ? Number(load.carrierRate) : 0;
  const margin =
    load.grossProfit !== null && load.grossProfit !== undefined
      ? Number(load.grossProfit)
      : carrierRate
        ? customerRate - carrierRate
        : 0;
  const documents = load.documents?.map(mapDocumentSummary) ?? [];
  const hasPod = documents.some((document) => document.type === "Pod");
  const invoice = load.invoice
    ? {
        amount: Number(load.invoice.amount),
        status: titleCaseEnum(load.invoice.status),
        dueDate: load.invoice.dueDate
          ? formatDate(load.invoice.dueDate)
          : "Not set",
        paidAt: load.invoice.paidAt ? formatFollowUp(load.invoice.paidAt) : "",
      }
    : null;
  const carrierQuotes = load.carrierQuotes?.map((quote) => {
    const quotedRate = Number(quote.quotedRate);
    const projectedMargin = customerRate - quotedRate;

    return {
      id: quote.id,
      carrierId: quote.carrierId,
      carrier: quote.carrier.companyName,
      complianceStatus: titleCaseEnum(quote.carrier.complianceStatus),
      quotedRate,
      projectedMargin,
      projectedMarginPercent: customerRate
        ? Number(((projectedMargin / customerRate) * 100).toFixed(1))
        : 0,
      status: titleCaseEnum(quote.status),
      notes: quote.notes ?? "No offer notes.",
      created: formatFollowUp(quote.createdAt),
    };
  }) ?? [];
  const carrierCandidates = load.sourcingCandidates?.map((candidate) => ({
    id: candidate.id,
    carrierId: candidate.carrierId ?? null,
    companyName: candidate.companyName,
    contactName: candidate.contactName ?? "Dispatch",
    phone: candidate.phone ?? "No phone",
    email: candidate.email ?? "No email",
    mcNumber: candidate.mcNumber ?? "MC needed",
    dotNumber: candidate.dotNumber ?? "DOT needed",
    source: titleCaseEnum(candidate.source),
    status: titleCaseEnum(candidate.status),
    suggestedRate:
      candidate.suggestedRate === null || candidate.suggestedRate === undefined
        ? null
        : Number(candidate.suggestedRate),
    matchScore:
      candidate.matchScore === null || candidate.matchScore === undefined
        ? null
        : Number(candidate.matchScore),
    complianceStatus: candidate.carrier
      ? titleCaseEnum(candidate.carrier.complianceStatus)
      : "Pending",
    complianceSnapshot:
      candidate.complianceSnapshot ?? "Compliance review not completed.",
    notes: candidate.notes ?? "No sourcing notes.",
    created: formatFollowUp(candidate.createdAt),
  })) ?? [];
  const integrationLogs = load.integrationLogs?.map((log) => ({
    id: log.id,
    provider: titleCaseEnum(log.provider),
    action: titleCaseEnum(log.action),
    status: titleCaseEnum(log.status),
    message: log.message ?? "No provider message.",
    error: log.error ?? null,
    created: formatFollowUp(log.createdAt),
  })) ?? [];

  const exceptions = (load.exceptions ?? []).map((ex) => ({
    id: ex.id,
    type: ex.type,
    status: titleCaseEnum(ex.status),
    owner: ex.owner?.name ?? null,
    notes: ex.notes ?? null,
    resolvedAt: ex.resolvedAt ? formatFollowUp(ex.resolvedAt) : null,
    created: formatFollowUp(ex.createdAt),
  }));

  const publicTrackingLinks = (load.publicTrackingLinks ?? []).map((link) => ({
    id: link.id,
    token: link.token,
    expiresAt: formatFollowUp(link.expiresAt),
    revoked: link.revoked,
    created: formatFollowUp(link.createdAt),
  }));

  return {
    id: load.id,
    loadNumber: load.loadNumber
      ? `LD-${String(load.loadNumber).padStart(4, "0")}`
      : "LD-????",
    shipper: load.shipper.companyName,
    carrier: load.carrier?.companyName ?? "Carrier needed",
    lane: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
    originAddress: load.originAddress ?? "Pickup address needed",
    destinationAddress: load.destinationAddress ?? "Delivery address needed",
    equipment: load.equipmentType,
    commodity: load.commodity ?? "Commodity needed",
    weight: load.weight ? `${load.weight.toLocaleString()} lbs` : "Not set",
    palletCount:
      load.palletCount === null || load.palletCount === undefined
        ? "Not set"
        : load.palletCount.toString(),
    pieceCount:
      load.pieceCount === null || load.pieceCount === undefined
        ? "Not set"
        : load.pieceCount.toString(),
    dimensions: load.dimensions ?? "Not set",
    hazmat: load.hazmat ? "Yes" : "No",
    temperatureRequirement: load.temperatureRequirement ?? "None",
    appointmentRequired: load.appointmentRequired ? "Yes" : "No",
    accessorials: load.accessorials ?? "None",
    customerReference: load.customerReference ?? "Not set",
    carrierInvoiceNumber: load.carrierInvoiceNumber ?? null,
    carrierPaymentDue: load.carrierPaymentDue
      ? formatDate(load.carrierPaymentDue)
      : null,
    carrierPaidAt: load.carrierPaidAt
      ? formatFollowUp(load.carrierPaidAt)
      : null,
    status: titleCaseEnum(load.status),
    pickup: load.pickupDate ? formatDate(load.pickupDate) : "Not set",
    pickupWindow: load.pickupWindow ?? "Window needed",
    delivery: load.deliveryDate ? formatDate(load.deliveryDate) : "Not set",
    deliveryWindow: load.deliveryWindow ?? "Window needed",
    customerUpdateStatus: titleCaseEnum(
      load.customerUpdateStatus ?? "NOT_NEEDED",
    ),
    lastCustomerUpdateAt: load.lastCustomerUpdateAt
      ? formatFollowUp(load.lastCustomerUpdateAt)
      : "No customer update logged",
    rateConfirmationStatus: titleCaseEnum(
      load.rateConfirmationStatus ?? "NOT_STARTED",
    ),
    rateConfirmationSentAt: load.rateConfirmationSentAt
      ? formatFollowUp(load.rateConfirmationSentAt)
      : "Not sent",
    rateConfirmationSignedAt: load.rateConfirmationSignedAt
      ? formatFollowUp(load.rateConfirmationSignedAt)
      : "Not signed",
    customerRate,
    carrierRate,
    margin,
    marginPercent: customerRate ? Number(((margin / customerRate) * 100).toFixed(1)) : 0,
    risk:
      load.events[0]?.message ??
      "No recent tracking event. Add an update before contacting the shipper.",
    hasPod,
    billingReadiness: getBillingReadiness({
      status: titleCaseEnum(load.status),
      hasPod,
      invoice,
      hasCarrier: Boolean(load.carrier),
      hasCarrierRate: carrierRate > 0,
      rateConfirmationStatus: titleCaseEnum(
        load.rateConfirmationStatus ?? "NOT_STARTED",
      ),
    }),
    invoice,
    carrierCandidates,
    carrierQuotes,
    integrationLogs,
    events: load.events.map((event) => ({
      type: titleCaseEnum(event.type),
      message: event.message,
      location: event.location ?? "Location not set",
      time: formatFollowUp(event.occurredAt),
    })),
    documents,
    exceptions,
    publicTrackingLinks,
    rawPickupDate: load.pickupDate,
    rawDeliveryDate: load.deliveryDate,
  };
}

function getBillingReadiness(input: {
  status: string;
  hasPod: boolean;
  invoice: InvoiceView | null;
  hasCarrier: boolean;
  hasCarrierRate: boolean;
  rateConfirmationStatus: string;
}) {
  const {
    status,
    hasPod,
    invoice,
    hasCarrier,
    hasCarrierRate,
    rateConfirmationStatus,
  } = input;

  if (invoice?.status === "Paid") {
    return "Paid";
  }

  if (invoice) {
    return `Invoice ${invoice.status.toLowerCase()}`;
  }

  if (status === "Delivered" && !hasPod) {
    return "Needs POD";
  }

  if (!hasCarrier) {
    return "Needs carrier";
  }

  if (!hasCarrierRate) {
    return "Needs carrier rate";
  }

  if (rateConfirmationStatus !== "Signed") {
    return "Needs signed rate confirmation";
  }

  if (hasPod || status === "Pod Received") {
    return "Ready to invoice";
  }

  return "Not ready";
}

function parseAgentOutput(outputJson: unknown) {
  if (!outputJson || typeof outputJson !== "object") {
    return {};
  }

  const output = outputJson as {
    summary?: unknown;
    nextAction?: unknown;
  };

  return {
    summary: typeof output.summary === "string" ? output.summary : undefined,
    nextAction:
      typeof output.nextAction === "string" ? output.nextAction : undefined,
  };
}

function parseGatedActions(controlJson: unknown) {
  if (!controlJson || typeof controlJson !== "object") {
    return [];
  }

  const control = controlJson as { gatedActions?: unknown };

  if (!Array.isArray(control.gatedActions)) {
    return [];
  }

  return control.gatedActions.filter(
    (action): action is string => typeof action === "string",
  );
}

function mapCommunicationDraftRun(
  run: AiAgentRun | undefined,
): CommunicationDraftAuditView | null {
  if (!run) {
    return null;
  }

  const output =
    run.outputJson && typeof run.outputJson === "object"
      ? (run.outputJson as Record<string, unknown>)
      : {};

  return {
    runId: run.id,
    channel:
      typeof output.channel === "string" ? titleCaseEnum(output.channel) : "Draft",
    purpose:
      typeof output.purpose === "string" ? titleCaseEnum(output.purpose) : "Draft",
    subject: typeof output.subject === "string" ? output.subject : "AI draft",
    body: typeof output.body === "string" ? output.body : "",
    summary:
      typeof output.summary === "string"
        ? output.summary
        : "AI communication draft created.",
    confidence: run.confidence === null ? null : Number(run.confidence),
    nextAction:
      typeof output.nextAction === "string"
        ? output.nextAction
        : "Review and send manually.",
    status: titleCaseEnum(run.status),
    created: formatFollowUp(run.createdAt),
  };
}

export type ContactListItem = {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  company: string;
  shipperId: string;
  isPrimary: boolean;
};

export async function getContactListViews(): Promise<ContactListItem[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  try {
    const contacts = await prisma.contact.findMany({
      include: { shipper: { select: { id: true, companyName: true } } },
      orderBy: [{ shipper: { companyName: "asc" } }, { isPrimary: "desc" }],
      take: 200,
    });

    return contacts.map((c) => ({
      id: c.id,
      fullName: formatContactName(c),
      title: c.title ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.shipper.companyName,
      shipperId: c.shipper.id,
      isPrimary: c.isPrimary,
    }));
  } catch {
    return [];
  }
}

export async function getContactDetailView(
  id: string,
): Promise<ContactDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        shipper: true,
        leads: {
          include: { contact: true },
          orderBy: { updatedAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!contact) {
      return null;
    }

    return {
      id: contact.id,
      shipperId: contact.shipperId,
      company: contact.shipper.companyName,
      fullName: formatContactName(contact),
      firstName: contact.firstName,
      lastName: contact.lastName ?? "",
      title: contact.title ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      isPrimary: contact.isPrimary,
      leads: contact.leads.map((lead) => ({
        id: lead.id,
        company: contact.shipper.companyName,
        contact: formatContactName(lead.contact),
        title: lead.contact?.title ?? "Contact",
        phone: lead.contact?.phone ?? "No phone",
        email: lead.contact?.email ?? "No email",
        stage: titleCaseEnum(lead.stage),
        source: titleCaseEnum(lead.source),
        priority: formatPriority(lead.priority),
        lanes: "Lane details needed",
        equipment: "Equipment needed",
        volume: "Volume unknown",
        nextFollowUp: lead.nextFollowUpAt
          ? formatFollowUp(lead.nextFollowUpAt)
          : "No follow-up set",
        pain: lead.notes ?? "Needs qualification.",
        aiNextAction: lead.notes ?? "Qualify next action.",
      })),
      activities: contact.activities.map((activity) => ({
        company: contact.shipper.companyName,
        type: titleCaseEnum(activity.type),
        detail: activity.body ?? activity.subject ?? "Activity recorded.",
        time: formatFollowUp(activity.createdAt),
      })),
    };
  } catch {
    return null;
  }
}

export type AnalyticsData = {
  revenue: {
    totalRevenue: number;
    totalGrossProfit: number;
    avgMarginPercent: number;
    loadCount: number;
    revenueThisMonth: number;
    grossProfitThisMonth: number;
  };
  loadsByStatus: { status: string; count: number }[];
  topLanes: {
    origin: string;
    destination: string;
    count: number;
    avgGrossProfit: number;
  }[];
  laneIntelligence: {
    totalLanes: number;
    repeatLanes: number;
    avgQuoteConfidence: number;
    underpricedLanes: number;
    profiles: LaneIntelligenceProfile[];
    opportunities: LaneRevenueOpportunity[];
  };
  laneRuleManagement: {
    shippers: { id: string; companyName: string }[];
    templates: LaneQuoteTemplateView[];
    rules: LaneMarginRuleView[];
  };
  topCarriers: { name: string; loads: number; totalGrossProfit: number }[];
  salesFunnel: { stage: string; count: number }[];
  quoteConversion: { status: string; count: number }[];
};

export type LaneIntelligenceProfile = {
  key: string;
  origin: string;
  destination: string;
  equipment: string;
  loadCount: number;
  quoteRequestCount: number;
  customerCount: number;
  carrierCount: number;
  avgSellRate: number;
  avgBuyRate: number | null;
  avgGrossProfit: number;
  avgMarginPercent: number;
  winRate: number;
  quoteConfidence: number;
  benchmarkAverage: number | null;
  benchmarkSources: string[];
  topCustomer: string;
  topCarrier: string;
  latestActivity: string;
  seasonality: string;
  recommendation: string;
};

export type LaneRevenueOpportunity = {
  title: string;
  detail: string;
  impact: string;
  tone: "amber" | "emerald" | "red" | "sky";
};

export type LaneQuoteTemplateView = {
  id: string;
  name: string;
  shipper: string;
  lane: string;
  equipmentType: string;
  targetCarrierCost: number | null;
  customerRate: number | null;
  targetMarginPercent: number | null;
  notes: string | null;
};

export type LaneMarginRuleView = {
  id: string;
  name: string;
  shipper: string;
  lane: string;
  equipmentType: string;
  urgency: string;
  targetMarginPercent: number;
  minimumMarginPercent: number | null;
  priority: number;
  notes: string | null;
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleAnalyticsData();
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      allLoads,
      loadsThisMonth,
      loadGroups,
      topCarrierLoads,
      quoteRequests,
      laneQuoteTemplates,
      laneMarginRules,
      activeShippers,
      leadGroups,
      quoteGroups,
    ] = await Promise.all([
      prisma.load.findMany({
        select: {
          customerRate: true,
          grossProfit: true,
          originCity: true,
          originState: true,
          destinationCity: true,
          destinationState: true,
          equipmentType: true,
          carrierRate: true,
          status: true,
          createdAt: true,
          shipper: { select: { companyName: true } },
          carrier: { select: { companyName: true } },
        },
        where: { status: { in: ["INVOICED", "PAID", "POD_RECEIVED", "DELIVERED"] } },
      }),
      prisma.load.findMany({
        select: { customerRate: true, grossProfit: true },
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: ["INVOICED", "PAID", "POD_RECEIVED", "DELIVERED"] },
        },
      }),
      prisma.load.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.load.findMany({
        select: {
          carrier: { select: { companyName: true } },
          grossProfit: true,
        },
        where: { carrierId: { not: null } },
        take: 500,
      }),
      prisma.quoteRequest.findMany({
        select: {
          originCity: true,
          originState: true,
          destinationCity: true,
          destinationState: true,
          equipmentType: true,
          status: true,
          createdAt: true,
          shipper: { select: { companyName: true } },
          customerQuotes: {
            select: { status: true, quotedRate: true },
            orderBy: { createdAt: "desc" },
          },
          rateBenchmarks: {
            select: { source: true, averageRate: true, confidence: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.laneQuoteTemplate.findMany({
        where: { active: true },
        include: { shipper: { select: { companyName: true } } },
        orderBy: [{ createdAt: "desc" }],
        take: 20,
      }),
      prisma.laneMarginRule.findMany({
        where: { active: true },
        include: { shipper: { select: { companyName: true } } },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 20,
      }),
      prisma.shipper.findMany({
        where: { status: { in: ["LEAD", "ACTIVE"] } },
        select: { id: true, companyName: true },
        orderBy: { companyName: "asc" },
        take: 200,
      }),
      prisma.lead.groupBy({ by: ["stage"], _count: true }),
      prisma.quoteRequest.groupBy({ by: ["status"], _count: true }),
    ]);

    const isEmpty =
      allLoads.length === 0 &&
      leadGroups.length === 0 &&
      quoteGroups.length === 0;

    if (isEmpty) {
      return getSampleAnalyticsData();
    }

    const totalRevenue = allLoads.reduce(
      (s, l) => s + Number(l.customerRate),
      0,
    );
    const totalGP = allLoads.reduce(
      (s, l) => s + Number(l.grossProfit ?? 0),
      0,
    );
    const avgMargin =
      totalRevenue > 0 ? (totalGP / totalRevenue) * 100 : 0;

    const revenueThisMonth = loadsThisMonth.reduce(
      (s, l) => s + Number(l.customerRate),
      0,
    );
    const gpThisMonth = loadsThisMonth.reduce(
      (s, l) => s + Number(l.grossProfit ?? 0),
      0,
    );

    const laneMap = new Map<
      string,
      { count: number; totalGP: number }
    >();
    for (const load of allLoads) {
      const key = `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`;
      const existing = laneMap.get(key) ?? { count: 0, totalGP: 0 };
      laneMap.set(key, {
        count: existing.count + 1,
        totalGP: existing.totalGP + Number(load.grossProfit ?? 0),
      });
    }
    const topLanes = [...laneMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([lane, data]) => {
        const [origin, destination] = lane.split(" → ");
        return {
          origin: origin ?? lane,
          destination: destination ?? "",
          count: data.count,
          avgGrossProfit: data.count > 0 ? data.totalGP / data.count : 0,
        };
      });

    const carrierMap = new Map<string, { loads: number; totalGP: number }>();
    for (const load of topCarrierLoads) {
      const name = load.carrier?.companyName ?? "Unknown";
      const existing = carrierMap.get(name) ?? { loads: 0, totalGP: 0 };
      carrierMap.set(name, {
        loads: existing.loads + 1,
        totalGP: existing.totalGP + Number(load.grossProfit ?? 0),
      });
    }
    const topCarriers = [...carrierMap.entries()]
      .sort((a, b) => b[1].loads - a[1].loads)
      .slice(0, 8)
      .map(([name, data]) => ({ name, ...data, totalGrossProfit: data.totalGP }));
    const laneIntelligence = buildLaneIntelligence(allLoads, quoteRequests);
    const laneRuleManagement = {
      shippers: activeShippers,
      templates: laneQuoteTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        shipper: template.shipper?.companyName ?? "Any customer",
        lane: `${template.originCity}, ${template.originState} -> ${template.destinationCity}, ${template.destinationState}`,
        equipmentType: template.equipmentType,
        targetCarrierCost:
          template.targetCarrierCost === null
            ? null
            : Number(template.targetCarrierCost),
        customerRate:
          template.customerRate === null ? null : Number(template.customerRate),
        targetMarginPercent:
          template.targetMarginPercent === null
            ? null
            : Number(template.targetMarginPercent),
        notes: template.notes,
      })),
      rules: laneMarginRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        shipper: rule.shipper?.companyName ?? "Any customer",
        lane:
          rule.originCity && rule.originState && rule.destinationCity && rule.destinationState
            ? `${rule.originCity}, ${rule.originState} -> ${rule.destinationCity}, ${rule.destinationState}`
            : "Any lane",
        equipmentType: rule.equipmentType ?? "Any equipment",
        urgency: rule.urgency ?? "Any urgency",
        targetMarginPercent: Number(rule.targetMarginPercent),
        minimumMarginPercent:
          rule.minimumMarginPercent === null
            ? null
            : Number(rule.minimumMarginPercent),
        priority: rule.priority,
        notes: rule.notes,
      })),
    };

    const statusOrder = [
      "TENDERED",
      "BOOKED",
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
      "POD_RECEIVED",
      "INVOICED",
      "PAID",
    ];
    const loadsByStatus = statusOrder.map((status) => ({
      status: titleCaseEnum(status),
      count: loadGroups.find((g) => g.status === status)?._count ?? 0,
    }));

    const stageOrder = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"];
    const salesFunnel = stageOrder.map((stage) => ({
      stage: titleCaseEnum(stage),
      count: leadGroups.find((g) => g.stage === stage)?._count ?? 0,
    }));

    const quoteOrder = ["NEW", "PRICING", "QUOTED", "ACCEPTED", "REJECTED"];
    const quoteConversion = quoteOrder.map((status) => ({
      status: titleCaseEnum(status),
      count: quoteGroups.find((g) => g.status === status)?._count ?? 0,
    }));

    return {
      revenue: {
        totalRevenue,
        totalGrossProfit: totalGP,
        avgMarginPercent: avgMargin,
        loadCount: allLoads.length,
        revenueThisMonth,
        grossProfitThisMonth: gpThisMonth,
      },
      loadsByStatus,
      topLanes,
      laneIntelligence,
      laneRuleManagement,
      topCarriers,
      salesFunnel,
      quoteConversion,
    };
  } catch {
    return getSampleAnalyticsData();
  }
}

type LaneSourceLoad = {
  customerRate: unknown;
  carrierRate: unknown;
  grossProfit: unknown;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  status: string;
  createdAt: Date;
  shipper: { companyName: string } | null;
  carrier: { companyName: string } | null;
};

type LaneSourceQuote = {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  status: string;
  createdAt: Date;
  shipper: { companyName: string } | null;
  customerQuotes: {
    status: string;
    quotedRate: unknown;
  }[];
  rateBenchmarks: {
    source: string;
    averageRate: unknown;
    confidence: unknown;
  }[];
};

type LaneAggregation = {
  origin: string;
  destination: string;
  equipment: string;
  loads: LaneSourceLoad[];
  quotes: LaneSourceQuote[];
  customers: Map<string, number>;
  carriers: Map<string, number>;
  benchmarkRates: number[];
  benchmarkSources: Set<string>;
  activityDates: Date[];
};

function buildLaneIntelligence(
  loads: LaneSourceLoad[],
  quoteRequests: LaneSourceQuote[],
): AnalyticsData["laneIntelligence"] {
  const laneMap = new Map<string, LaneAggregation>();

  for (const load of loads) {
    const lane = getLaneAggregation(laneMap, {
      originCity: load.originCity,
      originState: load.originState,
      destinationCity: load.destinationCity,
      destinationState: load.destinationState,
      equipmentType: load.equipmentType,
    });

    lane.loads.push(load);
    lane.activityDates.push(load.createdAt);
    addCount(lane.customers, load.shipper?.companyName ?? "Unknown customer");
    if (load.carrier?.companyName) {
      addCount(lane.carriers, load.carrier.companyName);
    }
  }

  for (const quote of quoteRequests) {
    const lane = getLaneAggregation(laneMap, quote);
    lane.quotes.push(quote);
    lane.activityDates.push(quote.createdAt);
    addCount(lane.customers, quote.shipper?.companyName ?? "Unknown customer");

    for (const benchmark of quote.rateBenchmarks) {
      const rate = Number(benchmark.averageRate);
      if (Number.isFinite(rate)) {
        lane.benchmarkRates.push(rate);
      }
      lane.benchmarkSources.add(titleCaseEnum(benchmark.source));
    }
  }

  const profiles = [...laneMap.entries()]
    .map(([key, lane]) => buildLaneProfile(key, lane))
    .sort((a, b) => {
      const bActivity = b.loadCount * 3 + b.quoteRequestCount;
      const aActivity = a.loadCount * 3 + a.quoteRequestCount;
      return bActivity - aActivity || b.avgGrossProfit - a.avgGrossProfit;
    })
    .slice(0, 10);

  const repeatLanes = profiles.filter(
    (profile) => profile.loadCount >= 2 || profile.quoteRequestCount >= 3,
  ).length;
  const avgQuoteConfidence = averageNumber(
    profiles.map((profile) => profile.quoteConfidence),
  );
  const underpricedLanes = profiles.filter(
    (profile) => profile.loadCount > 0 && profile.avgMarginPercent < 15,
  ).length;

  return {
    totalLanes: laneMap.size,
    repeatLanes,
    avgQuoteConfidence: Math.round(avgQuoteConfidence ?? 0),
    underpricedLanes,
    profiles,
    opportunities: buildLaneOpportunities(profiles),
  };
}

function buildLaneProfile(
  key: string,
  lane: LaneAggregation,
): LaneIntelligenceProfile {
  const sellRates = [
    ...lane.loads.map((load) => Number(load.customerRate)),
    ...lane.quotes.flatMap((quote) =>
      quote.customerQuotes.map((customerQuote) =>
        Number(customerQuote.quotedRate),
      ),
    ),
  ].filter(Number.isFinite);
  const buyRates = lane.loads
    .map((load) => Number(load.carrierRate))
    .filter(Number.isFinite);
  const grossProfits = lane.loads
    .map((load) => Number(load.grossProfit ?? 0))
    .filter(Number.isFinite);
  const acceptedQuotes = lane.quotes.filter(
    (quote) =>
      quote.status === "ACCEPTED" ||
      quote.customerQuotes.some((customerQuote) => customerQuote.status === "ACCEPTED"),
  ).length;
  const rejectedQuotes = lane.quotes.filter(
    (quote) =>
      quote.status === "REJECTED" ||
      quote.customerQuotes.some((customerQuote) => customerQuote.status === "REJECTED"),
  ).length;
  const decisionCount = acceptedQuotes + rejectedQuotes;
  const avgSellRate = Math.round(averageNumber(sellRates) ?? 0);
  const avgBuyRate = averageNumber(buyRates);
  const avgGrossProfit = Math.round(averageNumber(grossProfits) ?? 0);
  const avgMarginPercent =
    avgSellRate > 0 ? Number(((avgGrossProfit / avgSellRate) * 100).toFixed(1)) : 0;
  const latestDate = new Date(
    Math.max(...lane.activityDates.map((date) => date.getTime())),
  );

  return {
    key,
    origin: lane.origin,
    destination: lane.destination,
    equipment: lane.equipment,
    loadCount: lane.loads.length,
    quoteRequestCount: lane.quotes.length,
    customerCount: lane.customers.size,
    carrierCount: lane.carriers.size,
    avgSellRate,
    avgBuyRate: avgBuyRate === null ? null : Math.round(avgBuyRate),
    avgGrossProfit,
    avgMarginPercent,
    winRate: decisionCount > 0 ? Math.round((acceptedQuotes / decisionCount) * 100) : 0,
    quoteConfidence: getLaneQuoteConfidence({
      benchmarkCount: lane.benchmarkRates.length,
      carrierCount: lane.carriers.size,
      loadCount: lane.loads.length,
      marginPercent: avgMarginPercent,
      quoteRequestCount: lane.quotes.length,
    }),
    benchmarkAverage: averageNumber(lane.benchmarkRates),
    benchmarkSources: [...lane.benchmarkSources].slice(0, 3),
    topCustomer: getTopMapEntry(lane.customers) ?? "No customer history",
    topCarrier: getTopMapEntry(lane.carriers) ?? "No carrier history",
    latestActivity: formatDate(latestDate),
    seasonality: getLaneSeasonality(lane.activityDates),
    recommendation: getLaneRecommendation({
      loadCount: lane.loads.length,
      quoteRequestCount: lane.quotes.length,
      avgMarginPercent,
      benchmarkCount: lane.benchmarkRates.length,
      carrierCount: lane.carriers.size,
    }),
  };
}

function getLaneAggregation(
  laneMap: Map<string, LaneAggregation>,
  input: {
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    equipmentType: string;
  },
) {
  const origin = `${input.originCity}, ${input.originState}`;
  const destination = `${input.destinationCity}, ${input.destinationState}`;
  const equipment = input.equipmentType || "Dry van";
  const key = [
    origin.toLowerCase(),
    destination.toLowerCase(),
    equipment.toLowerCase(),
  ].join("|");

  const existing = laneMap.get(key);
  if (existing) {
    return existing;
  }

  const lane: LaneAggregation = {
    origin,
    destination,
    equipment,
    loads: [],
    quotes: [],
    customers: new Map(),
    carriers: new Map(),
    benchmarkRates: [],
    benchmarkSources: new Set(),
    activityDates: [],
  };
  laneMap.set(key, lane);
  return lane;
}

function buildLaneOpportunities(
  profiles: LaneIntelligenceProfile[],
): LaneRevenueOpportunity[] {
  const opportunities: LaneRevenueOpportunity[] = [];
  const underpriced = profiles
    .filter((profile) => profile.loadCount > 0 && profile.avgMarginPercent < 15)
    .sort((a, b) => a.avgMarginPercent - b.avgMarginPercent)[0];
  const repeat = profiles
    .filter((profile) => profile.loadCount >= 2 || profile.quoteRequestCount >= 3)
    .sort((a, b) => b.avgGrossProfit - a.avgGrossProfit)[0];
  const lowConfidence = profiles
    .filter((profile) => profile.quoteRequestCount > 0 && profile.quoteConfidence < 55)
    .sort((a, b) => a.quoteConfidence - b.quoteConfidence)[0];
  const carrierGap = profiles
    .filter((profile) => profile.loadCount > 0 && profile.carrierCount <= 1)
    .sort((a, b) => b.loadCount - a.loadCount)[0];

  if (underpriced) {
    opportunities.push({
      title: "Margin rule needed",
      detail: `${underpriced.origin} -> ${underpriced.destination} is averaging ${underpriced.avgMarginPercent}% margin.`,
      impact: "Review target margin before the next quote.",
      tone: "red",
    });
  }

  if (repeat) {
    opportunities.push({
      title: "Repeat lane candidate",
      detail: `${repeat.topCustomer} has recurring activity on ${repeat.origin} -> ${repeat.destination}.`,
      impact: "Build a saved quote template in the next Phase 9 slice.",
      tone: "emerald",
    });
  }

  if (lowConfidence) {
    opportunities.push({
      title: "Benchmark gap",
      detail: `${lowConfidence.origin} -> ${lowConfidence.destination} has ${lowConfidence.quoteConfidence}% confidence.`,
      impact: "Add DAT/Truckstop or manual benchmarks before quoting.",
      tone: "amber",
    });
  }

  if (carrierGap) {
    opportunities.push({
      title: "Carrier coverage gap",
      detail: `${carrierGap.origin} -> ${carrierGap.destination} has ${carrierGap.carrierCount} carrier in history.`,
      impact: "Source more vetted carriers before tendering repeat freight.",
      tone: "sky",
    });
  }

  return opportunities.slice(0, 4);
}

function getLaneQuoteConfidence(input: {
  benchmarkCount: number;
  carrierCount: number;
  loadCount: number;
  marginPercent: number;
  quoteRequestCount: number;
}) {
  const historyScore = Math.min(input.loadCount * 8, 32);
  const quoteScore = Math.min(input.quoteRequestCount * 4, 16);
  const benchmarkScore = Math.min(input.benchmarkCount * 10, 30);
  const carrierScore = Math.min(input.carrierCount * 4, 12);
  const marginScore = input.marginPercent >= 15 && input.marginPercent <= 30 ? 10 : 4;

  return Math.min(
    100,
    Math.round(historyScore + quoteScore + benchmarkScore + carrierScore + marginScore),
  );
}

function getLaneRecommendation(input: {
  avgMarginPercent: number;
  benchmarkCount: number;
  carrierCount: number;
  loadCount: number;
  quoteRequestCount: number;
}) {
  if (input.loadCount > 0 && input.avgMarginPercent < 15) {
    return "Raise target margin or validate buy rate before quoting again.";
  }

  if (input.benchmarkCount === 0) {
    return "Add DAT/Truckstop or manual benchmark before the next customer quote.";
  }

  if (input.carrierCount <= 1 && input.loadCount > 0) {
    return "Add carrier options so one truck does not control the lane.";
  }

  if (input.loadCount >= 2 || input.quoteRequestCount >= 3) {
    return "Good candidate for a recurring-lane quote template.";
  }

  return "Watch for repeat volume before creating a lane rule.";
}

function getLaneSeasonality(dates: Date[]) {
  if (!dates.length) {
    return "No history";
  }

  const monthCounts = new Map<number, number>();
  for (const date of dates) {
    addCount(monthCounts, date.getMonth());
  }

  const topMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topMonth) {
    return "No pattern";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(2024, topMonth[0], 1),
  );
}

function addCount<T>(map: Map<T, number>, key: T) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function getTopMapEntry(map: Map<string, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function averageNumber(values: number[]) {
  const numbers = values.filter(Number.isFinite);

  if (!numbers.length) {
    return null;
  }

  return numbers.reduce((total, value) => total + value, 0) / numbers.length;
}

// ─── Carrier Invoices (AP / Payables) ─────────────────────────────────────────

export type CarrierInvoiceView = {
  id: string;
  loadId: string;
  loadNumber: string;
  carrierName: string;
  carrierId: string;
  lane: string;
  delivery: string;
  invoiceNumber: string | null;
  amount: number;
  agreedRate: number | null;
  status: string;
  paymentMethod: string | null;
  dueDate: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  disputeReason?: string | null;
  approvalOwner?: string | null;
  paymentBatch?: string | null;
  remittanceNotes?: string | null;
  quickPayMetadata?: string | null;
  isOverdue: boolean;
  invoiceDocument: LoadDocumentView | null;
  rateConfirmationDocument: LoadDocumentView | null;
};

export type LoadNeedingPayableView = {
  id: string;
  loadNumber: string;
  carrierName: string;
  carrierId: string;
  lane: string;
  delivery: string;
  agreedRate: number;
  status: string;
};

function formatMaybe(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function getIntegrationsOverview(): Promise<{
  providers: ProviderStatus[];
  totalLogs: number;
  failureRate: string;
  recentGlobalLogs: IntegrationLogView[];
}> {
  const providersList = [
    { key: "DAT", label: "DAT", envKey: "DAT_API_KEY", description: "Marketplace rates, capacity, load posting" },
    { key: "TRUCKSTOP", label: "TRUCKSTOP", envKey: "TRUCKSTOP_CLIENT_ID", description: "Rates, carrier risk, ELD" },
    { key: "TWILIO", label: "Twilio", envKey: "TWILIO_ACCOUNT_SID", description: "Voice/SMS automation and callbacks" },
    { key: "RESEND", label: "Resend", envKey: "RESEND_API_KEY", description: "Transactional email and webhooks" },
    { key: "XAI", label: "xAI (Grok)", envKey: "XAI_API_KEY", description: "AI agents and reasoning" },
    { key: "FMCSA", label: "FMCSA", envKey: "FMCSA_WEB_KEY", description: "Carrier authority and safety data" },
    { key: "HERE", label: "HERE", envKey: "HERE_API_KEY", description: "Truck routing and mileage" },
    { key: "EIA", label: "EIA", envKey: "EIA_API_KEY", description: "Diesel price benchmarks" },
    { key: "CARRIEROK", label: "CarrierOk", envKey: "CARRIEROK_API_KEY", description: "Carrier risk and vetting" },
  ];

  if (!hasDatabaseUrl() || !prisma) {
    return {
      providers: providersList.map((p) => ({
        name: p.label,
        key: p.key,
        envKey: p.envKey,
        description: p.description,
        configured: !!process.env[p.envKey],
        lastSuccess: null,
        lastFailure: null,
        recentLogs: [],
        recentCount: 0,
        successCount: 0,
        failureCount: 0,
      })),
      totalLogs: 0,
      failureRate: "N/A (no DB)",
      recentGlobalLogs: [],
    };
  }

  const logs = await prisma.integrationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const byProvider: Record<string, unknown[]> = {};
  logs.forEach((log) => {
    const key = log.provider as string;
    if (!byProvider[key]) byProvider[key] = [];
    byProvider[key].push(log);
  });

  const providers = providersList.map((p) => {
    const pLogs = (byProvider[p.key] as unknown[]) || [];
    const lastSuccess = (pLogs.find((l: unknown) => (l as Record<string, unknown>).status === "SUCCESS") as Record<string, unknown> | undefined)?.createdAt as Date | undefined;
    const lastFailure = (pLogs.find((l: unknown) => (l as Record<string, unknown>).status === "FAILED") as Record<string, unknown> | undefined)?.createdAt as Date | undefined;
    const recentCount = pLogs.length;
    const successCount = pLogs.filter((l: unknown) => (l as Record<string, unknown>).status === "SUCCESS").length;
    const failureCount = pLogs.filter((l: unknown) => (l as Record<string, unknown>).status === "FAILED").length;
    return {
      name: p.label,
      key: p.key,
      envKey: p.envKey,
      description: p.description,
      configured: !!process.env[p.envKey],
      lastSuccess: lastSuccess ? formatFollowUp(lastSuccess) : null,
      lastFailure: lastFailure ? formatFollowUp(lastFailure) : null,
      recentLogs: pLogs.slice(0, 5).map((l: unknown) => {
        const r = l as Record<string, unknown>;
        return {
          id: String(r.id ?? ""),
          provider: String(r.provider ?? ""),
          action: String(r.action ?? ""),
          status: String(r.status ?? ""),
          message: (r.message as string) ?? "",
          error: (r.error as string) ?? null,
          created: formatFollowUp(r.createdAt as Date),
        };
      }),
      recentCount,
      successCount,
      failureCount,
    };
  });

  const total = logs.length;
  const failures = logs.filter((l) => l.status === "FAILED").length;
  const failureRate = total ? `${Math.round((failures / total) * 100)}%` : "0%";

  const recentGlobalLogs: IntegrationLogView[] = logs.slice(0, 12).map((l: unknown) => {
    const r = l as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      provider: String(r.provider ?? ""),
      action: String(r.action ?? ""),
      status: String(r.status ?? ""),
      message: (r.message as string) ?? "",
      error: (r.error as string) ?? null,
      created: formatFollowUp(r.createdAt as Date),
    };
  });

  return { providers, totalLogs: total, failureRate, recentGlobalLogs };
}

export async function getCarrierInvoiceViews(): Promise<CarrierInvoiceView[]> {
  if (!hasDatabaseUrl() || !prisma) return [];

  try {
    const records = await prisma.carrierInvoice.findMany({
      include: {
        load: {
          select: {
            loadNumber: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
            deliveryDate: true,
            documents: {
              where: { type: { in: ["INVOICE", "RATE_CONFIRMATION"] } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        carrier: { select: { companyName: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    const now = new Date();

    return records.map((r) => ({
      id: r.id,
      loadId: r.loadId,
      loadNumber: `L-${String(r.load?.loadNumber ?? "").padStart(4, "0")}`,
      carrierName: r.carrier?.companyName ?? "Unknown carrier",
      carrierId: r.carrierId,
      lane: r.load
        ? `${r.load.originCity}, ${r.load.originState} → ${r.load.destinationCity}, ${r.load.destinationState}`
        : "—",
      delivery: formatMaybe(r.load?.deliveryDate) ?? "TBD",
      invoiceNumber: r.invoiceNumber,
      amount: Number(r.amount),
      agreedRate: r.agreedRate != null ? Number(r.agreedRate) : null,
      status: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
      paymentMethod: r.paymentMethod,
      dueDate: formatMaybe(r.dueDate),
      approvedAt: formatMaybe(r.approvedAt),
      paidAt: formatMaybe(r.paidAt),
      notes: r.notes,
      disputeReason: r.disputeReason,
      approvalOwner: r.approvalOwner,
      paymentBatch: r.paymentBatch,
      remittanceNotes: r.remittanceNotes,
      quickPayMetadata: r.quickPayMetadata,
      isOverdue: r.dueDate != null && r.dueDate < now && r.paidAt == null,
      invoiceDocument:
        r.load?.documents.find((document) => document.type === "INVOICE")
          ? mapDocumentSummary(
              r.load.documents.find((document) => document.type === "INVOICE")!,
            )
          : null,
      rateConfirmationDocument:
        r.load?.documents.find((document) => document.type === "RATE_CONFIRMATION")
          ? mapDocumentSummary(
              r.load.documents.find(
                (document) => document.type === "RATE_CONFIRMATION",
              )!,
            )
          : null,
    }));
  } catch {
    return [];
  }
}

export async function getLoadsNeedingPayable(): Promise<LoadNeedingPayableView[]> {
  if (!hasDatabaseUrl() || !prisma) return [];

  try {
    const records = await prisma.load.findMany({
      where: {
        carrierId: { not: null },
        carrierRate: { not: null },
        status: {
          in: [
            LoadStatus.DELIVERED,
            LoadStatus.POD_RECEIVED,
            LoadStatus.INVOICED,
            LoadStatus.PAID,
          ],
        },
        carrierInvoice: null,
      },
      include: {
        carrier: { select: { companyName: true } },
      },
      orderBy: [{ deliveryDate: "asc" }, { updatedAt: "desc" }],
      take: 50,
    });

    return records.map((load) => ({
      id: load.id,
      loadNumber: `L-${String(load.loadNumber ?? "").padStart(4, "0")}`,
      carrierName: load.carrier?.companyName ?? "Unknown",
      carrierId: load.carrierId!,
      lane: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
      delivery: formatMaybe(load.deliveryDate) ?? "TBD",
      agreedRate: load.carrierRate != null ? Number(load.carrierRate) : 0,
      status: load.status.charAt(0) + load.status.slice(1).toLowerCase().replace(/_/g, " "),
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────

function getSampleAnalyticsData(): AnalyticsData {
  return {
    revenue: {
      totalRevenue: 284500,
      totalGrossProfit: 51210,
      avgMarginPercent: 18.0,
      loadCount: 47,
      revenueThisMonth: 62000,
      grossProfitThisMonth: 11160,
    },
    loadsByStatus: [
      { status: "Tendered", count: 3 },
      { status: "Booked", count: 5 },
      { status: "Picked Up", count: 4 },
      { status: "In Transit", count: 8 },
      { status: "Delivered", count: 6 },
      { status: "Pod Received", count: 4 },
      { status: "Invoiced", count: 9 },
      { status: "Paid", count: 8 },
    ],
    topLanes: [
      { origin: "Atlanta, GA", destination: "Nashville, TN", count: 12, avgGrossProfit: 1050 },
      { origin: "Atlanta, GA", destination: "Charlotte, NC", count: 9, avgGrossProfit: 870 },
      { origin: "Savannah, GA", destination: "Atlanta, GA", count: 7, avgGrossProfit: 720 },
      { origin: "Atlanta, GA", destination: "Memphis, TN", count: 6, avgGrossProfit: 940 },
      { origin: "Atlanta, GA", destination: "Dallas, TX", count: 5, avgGrossProfit: 1400 },
    ],
    laneIntelligence: {
      totalLanes: 14,
      repeatLanes: 5,
      avgQuoteConfidence: 72,
      underpricedLanes: 1,
      profiles: [
        {
          key: "atlanta-ga|nashville-tn|dry-van",
          origin: "Atlanta, GA",
          destination: "Nashville, TN",
          equipment: "Dry Van",
          loadCount: 12,
          quoteRequestCount: 7,
          customerCount: 4,
          carrierCount: 6,
          avgSellRate: 2450,
          avgBuyRate: 1975,
          avgGrossProfit: 475,
          avgMarginPercent: 19.4,
          winRate: 68,
          quoteConfidence: 86,
          benchmarkAverage: 2050,
          benchmarkSources: ["Dat", "Truckstop"],
          topCustomer: "Apex Manufacturing",
          topCarrier: "Blue Ridge Freight",
          latestActivity: "Jun 04",
          seasonality: "Jun",
          recommendation: "Good candidate for a recurring-lane quote template.",
        },
        {
          key: "savannah-ga|atlanta-ga|reefer",
          origin: "Savannah, GA",
          destination: "Atlanta, GA",
          equipment: "Reefer",
          loadCount: 7,
          quoteRequestCount: 4,
          customerCount: 2,
          carrierCount: 3,
          avgSellRate: 1850,
          avgBuyRate: 1625,
          avgGrossProfit: 225,
          avgMarginPercent: 12.2,
          winRate: 50,
          quoteConfidence: 64,
          benchmarkAverage: 1700,
          benchmarkSources: ["Manual"],
          topCustomer: "Cold Chain Foods",
          topCarrier: "Southern Express",
          latestActivity: "May 28",
          seasonality: "May",
          recommendation: "Raise target margin or validate buy rate before quoting again.",
        },
        {
          key: "atlanta-ga|dallas-tx|dry-van",
          origin: "Atlanta, GA",
          destination: "Dallas, TX",
          equipment: "Dry Van",
          loadCount: 5,
          quoteRequestCount: 6,
          customerCount: 3,
          carrierCount: 1,
          avgSellRate: 3200,
          avgBuyRate: 2600,
          avgGrossProfit: 600,
          avgMarginPercent: 18.8,
          winRate: 57,
          quoteConfidence: 58,
          benchmarkAverage: null,
          benchmarkSources: [],
          topCustomer: "Northstar Building Supply",
          topCarrier: "Appalachian Transport",
          latestActivity: "May 19",
          seasonality: "Apr",
          recommendation: "Add DAT/Truckstop or manual benchmark before the next customer quote.",
        },
      ],
      opportunities: [
        {
          title: "Margin rule needed",
          detail: "Savannah, GA -> Atlanta, GA is averaging 12.2% margin.",
          impact: "Review target margin before the next quote.",
          tone: "red",
        },
        {
          title: "Repeat lane candidate",
          detail: "Apex Manufacturing has recurring activity on Atlanta, GA -> Nashville, TN.",
          impact: "Build a saved quote template in the next Phase 9 slice.",
          tone: "emerald",
        },
        {
          title: "Benchmark gap",
          detail: "Atlanta, GA -> Dallas, TX has 58% confidence.",
          impact: "Add DAT/Truckstop or manual benchmarks before quoting.",
          tone: "amber",
        },
      ],
    },
    laneRuleManagement: {
      shippers: [
        { id: "sample-shipper-apex", companyName: "Apex Manufacturing" },
        { id: "sample-shipper-cold", companyName: "Cold Chain Foods" },
      ],
      templates: [
        {
          id: "sample-template-1",
          name: "Apex ATL -> Nashville dry van",
          shipper: "Apex Manufacturing",
          lane: "Atlanta, GA -> Nashville, TN",
          equipmentType: "Dry Van",
          targetCarrierCost: 1975,
          customerRate: 2450,
          targetMarginPercent: 19,
          notes: "Recurring dry van lane. Use short validity during volatile weeks.",
        },
      ],
      rules: [
        {
          id: "sample-rule-1",
          name: "Default dry van margin",
          shipper: "Any customer",
          lane: "Any lane",
          equipmentType: "Dry Van",
          urgency: "Any urgency",
          targetMarginPercent: 18,
          minimumMarginPercent: 15,
          priority: 3,
          notes: "Baseline rule for standard dry van quotes.",
        },
        {
          id: "sample-rule-2",
          name: "Savannah reefer margin floor",
          shipper: "Cold Chain Foods",
          lane: "Savannah, GA -> Atlanta, GA",
          equipmentType: "Reefer",
          urgency: "Any urgency",
          targetMarginPercent: 22,
          minimumMarginPercent: 18,
          priority: 1,
          notes: "Protect margin on reefer capacity.",
        },
      ],
    },
    topCarriers: [
      { name: "Blue Ridge Freight", loads: 14, totalGrossProfit: 15400 },
      { name: "Southern Express", loads: 11, totalGrossProfit: 9900 },
      { name: "Appalachian Transport", loads: 8, totalGrossProfit: 7200 },
      { name: "Peach State Carriers", loads: 6, totalGrossProfit: 5400 },
    ],
    salesFunnel: [
      { stage: "New", count: 18 },
      { stage: "Contacted", count: 12 },
      { stage: "Qualified", count: 8 },
      { stage: "Quoted", count: 5 },
      { stage: "Won", count: 14 },
      { stage: "Lost", count: 3 },
    ],
    quoteConversion: [
      { status: "New", count: 4 },
      { status: "Pricing", count: 3 },
      { status: "Quoted", count: 7 },
      { status: "Accepted", count: 12 },
      { status: "Rejected", count: 2 },
    ],
  };
}
