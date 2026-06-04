import {
  activities,
  carriers,
  leads,
  loads,
  quoteRequests,
  shippers,
} from "@/lib/data";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type LeadView = (typeof leads)[number];
export type ActivityView = (typeof activities)[number];
export type ShipperView = (typeof shippers)[number];
export type QuoteRequestView = (typeof quoteRequests)[number];
export type CarrierView = (typeof carriers)[number];
export type LoadView = (typeof loads)[number];
export type LoadDetailView = LoadView;

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
      return null;
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
    const fallback = leads.find((lead) => lead.id === id);
    return fallback
      ? {
          ...fallback,
          activities: activities.filter(
            (activity) => activity.company === fallback.company,
          ),
        }
      : null;
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

    return records.map((request) => ({
      company: request.shipper.companyName,
      lane: `${request.originCity}, ${request.originState} -> ${request.destinationCity}, ${request.destinationState}`,
      equipment: request.equipmentType,
      pickup: request.pickupDate ? formatDate(request.pickupDate) : "Not set",
      weight: request.weight ? `${request.weight.toLocaleString()} lbs` : "Not set",
      status: titleCaseEnum(request.status),
      details:
        request.specialRequirements ??
        request.commodity ??
        "Needs freight details before pricing.",
      aiSummary:
        "Validate service requirements, price the lane, then queue carrier coverage.",
    }));
  } catch {
    return quoteRequests;
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

export async function getLoadViews(): Promise<LoadView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return loads;
  }

  try {
    const records = await prisma.load.findMany({
      include: {
        shipper: true,
        carrier: true,
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
    return loads.find((load) => load.id === id) ?? null;
  }

  try {
    const load = await prisma.load.findUnique({
      where: { id },
      include: {
        shipper: true,
        carrier: true,
        events: {
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
      },
    });

    if (!load) {
      return null;
    }

    return mapLoad(load);
  } catch {
    return loads.find((load) => load.id === id) ?? null;
  }
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

function mapLoad(load: {
  id: string;
  shipper: { companyName: string };
  carrier?: { companyName: string } | null;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  status: string;
  pickupDate?: Date | null;
  deliveryDate?: Date | null;
  customerRate: unknown;
  carrierRate?: unknown | null;
  grossProfit?: unknown | null;
  events: Array<{
    type: string;
    message: string;
    location?: string | null;
    occurredAt: Date;
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

  return {
    id: load.id,
    shipper: load.shipper.companyName,
    carrier: load.carrier?.companyName ?? "Carrier needed",
    lane: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
    equipment: load.equipmentType,
    status: titleCaseEnum(load.status),
    pickup: load.pickupDate ? formatDate(load.pickupDate) : "Not set",
    delivery: load.deliveryDate ? formatDate(load.deliveryDate) : "Not set",
    customerRate,
    carrierRate,
    margin,
    marginPercent: customerRate ? Number(((margin / customerRate) * 100).toFixed(1)) : 0,
    risk:
      load.events[0]?.message ??
      "No recent tracking event. Add an update before contacting the shipper.",
    events: load.events.map((event) => ({
      type: titleCaseEnum(event.type),
      message: event.message,
      location: event.location ?? "Location not set",
      time: formatFollowUp(event.occurredAt),
    })),
  };
}
