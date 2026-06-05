import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type CallView = {
  id: string;
  direction: string;
  status: string;
  fromPhone: string;
  toPhone: string;
  shipper: string;
  contact: string;
  recordingStatus: string;
  transcriptStatus: string;
  extractionStatus: string;
  aiSummary: string;
  created: string;
};

export type CallDetailView = CallView & {
  twilioCallSid: string;
  recordingSid: string;
  recordingUrl: string;
  recordingDuration: string;
  transcriptText: string;
  missingQuestions: string[];
  extractedQuote: Record<string, string | number | boolean>;
  quoteRequestId: string;
  recentContext: string[];
};

export async function getCallViews(): Promise<CallView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  const calls = await prisma.brokerageCall.findMany({
    include: { shipper: true, contact: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return calls.map(mapCall);
}

export async function getCallDetailView(
  id: string,
): Promise<CallDetailView | null> {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  const call = await prisma.brokerageCall.findUnique({
    where: { id },
    include: {
      shipper: true,
      contact: true,
      quoteRequest: true,
    },
  });

  if (!call) {
    return null;
  }

  const recentContext = call.shipperId
    ? await getRecentShipperContext(call.shipperId)
    : [];
  const baseExtracted = parseExtractedQuote(call.aiExtractedJson);
  const extracted = {
    ...baseExtracted,
    companyName:
      baseExtracted.companyName ?? call.shipper?.companyName,
    contactName:
      baseExtracted.contactName ??
      (call.contact
        ? [call.contact.firstName, call.contact.lastName]
            .filter(Boolean)
            .join(" ")
        : undefined),
    phone: baseExtracted.phone ?? call.fromPhone,
  };
  const missingQuestions = Array.isArray(call.missingQuestions)
    ? call.missingQuestions.map(String)
    : [];

  return {
    ...mapCall(call),
    twilioCallSid: call.twilioCallSid ?? "Not set",
    recordingSid: call.recordingSid ?? "Not set",
    recordingUrl: call.recordingUrl ?? "",
    recordingDuration:
      call.recordingDuration === null || call.recordingDuration === undefined
        ? "Not set"
        : `${call.recordingDuration}s`,
    transcriptText: call.transcriptText ?? "",
    missingQuestions,
    extractedQuote: extracted,
    quoteRequestId: call.quoteRequestId ?? "",
    recentContext,
  };
}

export async function matchCallerByPhone(phone: string | undefined) {
  if (!phone || !prisma) {
    return { shipperId: null, contactId: null };
  }

  const normalized = normalizePhone(phone);

  if (!normalized) {
    return { shipperId: null, contactId: null };
  }

  const contacts = await prisma.contact.findMany({
    include: { shipper: true },
    take: 500,
  });
  const match = contacts.find((contact) => {
    const candidate = normalizePhone(contact.phone ?? "");
    return candidate && candidate.endsWith(normalized.slice(-10));
  });

  return {
    shipperId: match?.shipperId ?? null,
    contactId: match?.id ?? null,
  };
}

export async function getCallAiContext(callId: string) {
  if (!prisma) {
    return null;
  }

  const call = await prisma.brokerageCall.findUnique({
    where: { id: callId },
    include: {
      shipper: {
        include: {
          contacts: true,
          quoteRequests: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          loads: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      contact: true,
    },
  });

  if (!call) {
    return null;
  }

  return {
    call: {
      id: call.id,
      fromPhone: call.fromPhone,
      toPhone: call.toPhone,
      transcriptText: call.transcriptText,
      createdAt: call.createdAt,
    },
    shipper: call.shipper,
    contact: call.contact,
  };
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function mapCall(call: {
  id: string;
  direction: string;
  status: string;
  fromPhone?: string | null;
  toPhone?: string | null;
  shipper?: { companyName: string } | null;
  contact?: { firstName: string; lastName?: string | null } | null;
  recordingStatus: string;
  transcriptStatus: string;
  extractionStatus: string;
  aiSummary?: string | null;
  createdAt: Date;
}): CallView {
  return {
    id: call.id,
    direction: titleCaseEnum(call.direction),
    status: titleCaseEnum(call.status),
    fromPhone: call.fromPhone ?? "Unknown caller",
    toPhone: call.toPhone ?? "Unknown number",
    shipper: call.shipper?.companyName ?? "Unmatched shipper",
    contact: call.contact
      ? [call.contact.firstName, call.contact.lastName].filter(Boolean).join(" ")
      : "Unmatched contact",
    recordingStatus: titleCaseEnum(call.recordingStatus),
    transcriptStatus: titleCaseEnum(call.transcriptStatus),
    extractionStatus: titleCaseEnum(call.extractionStatus),
    aiSummary: call.aiSummary ?? "No AI summary yet.",
    created: formatFollowUp(call.createdAt),
  };
}

async function getRecentShipperContext(shipperId: string) {
  if (!prisma) {
    return [];
  }

  const [activities, quotes, loads] = await Promise.all([
    prisma.activity.findMany({
      where: { shipperId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.quoteRequest.findMany({
      where: { shipperId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.load.findMany({
      where: { shipperId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return [
    ...activities.map(
      (activity) =>
        `${titleCaseEnum(activity.type)}: ${activity.body ?? activity.subject ?? "Activity logged."}`,
    ),
    ...quotes.map(
      (quote) =>
        `Quote: ${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState} (${quote.equipmentType})`,
    ),
    ...loads.map(
      (load) =>
        `Load: ${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState} (${load.status})`,
    ),
  ];
}

function parseExtractedQuote(input: unknown) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const output = input as {
    quoteRequest?: unknown;
  };

  if (!output.quoteRequest || typeof output.quoteRequest !== "object") {
    return {};
  }

  return output.quoteRequest as Record<string, string | number | boolean>;
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFollowUp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
