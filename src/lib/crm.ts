import {
  activities,
  carriers,
  leads,
  loads,
  quoteRequests,
  shippers,
} from "@/lib/data";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import type { AiAgentRun } from "@prisma/client";

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
};
export type LoadDocumentView = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  created: string;
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
export type InvoiceView = {
  amount: number;
  status: string;
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
export type LoadView = {
  id: string;
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
  carrierCandidates: CarrierSourcingCandidateView[];
  carrierQuotes: CarrierQuoteView[];
  integrationLogs: IntegrationLogView[];
  events: LoadEventView[];
  documents: LoadDocumentView[];
};
export type LoadDetailView = LoadView;
export type ShipperDetailView = ShipperView & {
  leads: LeadView[];
  quoteRequests: QuoteRequestView[];
  loads: LoadView[];
};
export type CarrierDetailView = CarrierView & {
  loads: LoadView[];
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
  laneHistory: LaneHistoryView[];
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
        loads: {
          include: { carrier: true, events: { orderBy: { occurredAt: "desc" } } },
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
          select: { id: true },
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
      preferredLanes: Array.isArray(carrier.preferredLanes)
        ? carrier.preferredLanes.map(String)
        : ["Lane history needed"],
      notes: carrier.notes ?? "No notes yet.",
      loadCount: carrier.loads.length,
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
        loads: {
          include: { shipper: true, carrier: true, events: true },
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
      preferredLanes: Array.isArray(carrier.preferredLanes)
        ? carrier.preferredLanes.map(String)
        : ["Lane history needed"],
      notes: carrier.notes ?? "No notes yet.",
      loadCount: carrier.loads.length,
      loads: carrier.loads.map((load) => mapLoad(load)),
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
      created: "Demo",
    },
  ];
}

function mapAiAgentRun(run: AiAgentRun): AiAgentRunView {
  const output = parseAgentOutput(run.outputJson);

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

function getSampleShipperDetailView(id: string): ShipperDetailView | null {
  const sample = shippers.find((shipper) => shipper.id === id);

  return sample
    ? {
        ...sample,
        leads: leads.filter((lead) => lead.company === sample.company),
        quoteRequests: quoteRequests.filter(
          (quote) => quote.company === sample.company,
        ),
        loads: loads.filter((load) => load.shipper === sample.company),
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

function mapLoad(load: {
  id: string;
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
  const documents = load.documents?.map((document) => ({
    id: document.id,
    type: titleCaseEnum(document.type),
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    created: formatFollowUp(document.createdAt),
  })) ?? [];
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

  return {
    id: load.id,
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
