import { revalidatePath } from "next/cache";

import {
  DocumentExtractionStatus,
  DocumentStatus,
  Prisma,
} from "@prisma/client";

import {
  getAgentAutomationPolicy,
  getEffectiveAgentRunStatus,
} from "@/lib/agent-control";
import {
  runDocumentExtraction,
  type DocumentStructuredFields,
} from "@/lib/documents";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  getAgentMode,
  getAgentPromptTemplate,
} from "@/lib/settings";

const documentAutomationAgentName = "Document Automation Agent" as const;
const automatedStatuses = [
  DocumentExtractionStatus.NOT_REQUESTED,
  DocumentExtractionStatus.PENDING,
  DocumentExtractionStatus.FAILED,
];

export type DocumentAutomationQueueItem = {
  id: string;
  fileName: string;
  type: string;
  relatedLabel: string;
  extractionStatus: string;
  status: string;
  reason: string;
  href: string;
  priority: "High" | "Medium" | "Low";
};

export type DocumentAutomationView = {
  pendingCount: number;
  reviewCount: number;
  failedCount: number;
  completedCount: number;
  latestRun: {
    id: string;
    status: string;
    summary: string;
    created: string;
  } | null;
  queue: DocumentAutomationQueueItem[];
};

export async function getDocumentAutomationView(): Promise<DocumentAutomationView> {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      pendingCount: 0,
      reviewCount: 0,
      failedCount: 0,
      completedCount: 0,
      latestRun: null,
      queue: [],
    };
  }

  const [
    pendingCount,
    reviewCount,
    failedCount,
    completedCount,
    queueDocs,
    latestRun,
  ] = await Promise.all([
    prisma.document.count({
      where: { extractionStatus: { in: automatedStatuses } },
    }),
    prisma.document.count({ where: { status: DocumentStatus.NEEDS_REVIEW } }),
    prisma.document.count({
      where: { extractionStatus: DocumentExtractionStatus.FAILED },
    }),
    prisma.document.count({
      where: { extractionStatus: DocumentExtractionStatus.COMPLETED },
    }),
    prisma.document.findMany({
      where: {
        OR: [
          { extractionStatus: { in: automatedStatuses } },
          { status: DocumentStatus.NEEDS_REVIEW },
        ],
      },
      include: {
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
        shipper: { select: { companyName: true } },
        carrier: { select: { companyName: true } },
        quoteRequest: {
          select: {
            id: true,
            originCity: true,
            originState: true,
            destinationCity: true,
            destinationState: true,
          },
        },
      },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.aiAgentRun.findFirst({
      where: { agentName: documentAutomationAgentName },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    pendingCount,
    reviewCount,
    failedCount,
    completedCount,
    latestRun: latestRun
      ? {
          id: latestRun.id,
          status: titleCaseEnum(latestRun.status),
          summary: getRunSummary(latestRun.outputJson),
          created: formatAutomationDate(latestRun.createdAt),
        }
      : null,
    queue: queueDocs.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      type: titleCaseEnum(document.type),
      relatedLabel: getRelatedLabel(document),
      extractionStatus: titleCaseEnum(document.extractionStatus),
      status: titleCaseEnum(document.status),
      reason: getQueueReason(document),
      href: getDocumentReviewHref(document),
      priority: getQueuePriority(document),
    })),
  };
}

export async function runPendingDocumentAutomation(limit = 12) {
  if (!hasDatabaseUrl() || !prisma) {
    throw new Error("Database is not configured.");
  }

  const documents = await prisma.document.findMany({
    where: { extractionStatus: { in: automatedStatuses } },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });
  const results = [];

  for (const document of documents) {
    const extraction = await runDocumentExtraction(document.id);
    const reasons = buildReviewReasons(document, extraction);
    const needsReview =
      extraction.status !== DocumentExtractionStatus.COMPLETED ||
      reasons.length > 0;

    if (needsReview) {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.NEEDS_REVIEW,
          extractedFields: mergeFieldExceptions(
            extraction.extractedFields,
            reasons,
          ) as Prisma.InputJsonValue,
        },
      });
    }

    results.push({
      documentId: document.id,
      fileName: document.fileName,
      type: document.type,
      status: extraction.status,
      needsReview,
      reasons,
      error: extraction.error ?? null,
    });
  }

  const mode = await getAgentMode(documentAutomationAgentName);
  const policy = getAgentAutomationPolicy(documentAutomationAgentName);
  const runStatus = getEffectiveAgentRunStatus({ mode, policy });
  const instructions = await getAgentPromptTemplate(documentAutomationAgentName);
  const summary = summarizeBatch(results);
  const run = await prisma.aiAgentRun.create({
    data: {
      agentName: documentAutomationAgentName,
      relatedEntityType: "DocumentBatch",
      relatedEntityId: new Date().toISOString().slice(0, 10),
      status: runStatus,
      prompt: `Template: ${documentAutomationAgentName} v${instructions.version}`,
      inputJson: {
        requestedAt: new Date().toISOString(),
        automationMode: mode,
        riskLevel: policy.riskLevel,
        approvalRequired: policy.approvalRequired,
        gatedActions: policy.gatedActions,
        documentIds: documents.map((document) => document.id),
      },
      outputJson: {
        summary,
        confidence: results.length ? 0.75 : 0.9,
        nextAction:
          results.some((result) => result.needsReview)
            ? "Review exception documents before applying any extracted fields downstream."
            : "No document exceptions were found. Continue monitoring new uploads.",
        processedCount: results.length,
        reviewCount: results.filter((result) => result.needsReview).length,
        results,
      },
      confidence: results.length ? 0.75 : 0.9,
      automationMode: mode,
      riskLevel: policy.riskLevel,
      approvalRequired: policy.approvalRequired,
      actionSummary:
        "Ran pending document extraction and queued human review. No load, invoice, payable, billing, carrier, or compliance record was updated from extracted fields.",
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
          "Extraction only. Humans must review fields before downstream operational changes.",
      },
    },
  });

  revalidatePath("/documents");
  revalidatePath("/agents");
  revalidatePath("/dashboard");

  return {
    message: `Processed ${results.length} document${results.length === 1 ? "" : "s"}. ${results.filter((result) => result.needsReview).length} need review.`,
    runId: run.id,
    processedCount: results.length,
    reviewCount: results.filter((result) => result.needsReview).length,
    results,
  };
}

function buildReviewReasons(
  document: {
    type: string;
    fileName: string;
    mimeType: string | null;
  },
  extraction: Awaited<ReturnType<typeof runDocumentExtraction>>,
) {
  const fields = extraction.extractedFields;
  const reasons = new Set<string>();
  const confidence = fields?.extractionConfidence;

  if (extraction.error) {
    reasons.add(extraction.error);
  }

  if (extraction.status !== DocumentExtractionStatus.COMPLETED) {
    reasons.add("Extraction did not complete successfully.");
  }

  if (typeof confidence === "number" && confidence < 0.45) {
    reasons.add("Low confidence extraction.");
  }

  if (fields?.exceptions?.length) {
    for (const exception of fields.exceptions) {
      reasons.add(exception);
    }
  }

  if (["BOL", "POD"].includes(document.type) && !fields?.bolNumber && !fields?.proNumber) {
    reasons.add("Missing BOL or PRO number.");
  }

  if (document.type === "INVOICE") {
    if (!fields?.rate) reasons.add("Missing invoice rate.");
    if (!fields?.carrierName) reasons.add("Missing carrier name.");
  }

  if (
    document.mimeType === "application/pdf" &&
    extraction.status !== DocumentExtractionStatus.COMPLETED
  ) {
    reasons.add("PDF requires OCR/PDF provider or manual text review.");
  }

  return [...reasons];
}

function mergeFieldExceptions(
  fields: DocumentStructuredFields | null | undefined,
  reasons: string[],
) {
  return {
    ...(fields ?? {}),
    exceptions: [...new Set([...(fields?.exceptions ?? []), ...reasons])],
  };
}

function summarizeBatch(
  results: Array<{
    status: DocumentExtractionStatus;
    needsReview: boolean;
  }>,
) {
  if (!results.length) {
    return "No pending document extraction jobs were available.";
  }

  const completed = results.filter(
    (result) => result.status === DocumentExtractionStatus.COMPLETED,
  ).length;
  const review = results.filter((result) => result.needsReview).length;

  return `${completed} of ${results.length} document extraction job${results.length === 1 ? "" : "s"} completed. ${review} document${review === 1 ? "" : "s"} need human review before downstream use.`;
}

function getRunSummary(outputJson: unknown) {
  if (!outputJson || typeof outputJson !== "object") {
    return "Document automation run logged.";
  }

  const output = outputJson as { summary?: unknown };
  return typeof output.summary === "string"
    ? output.summary
    : "Document automation run logged.";
}

function getQueueReason(document: {
  extractionStatus: DocumentExtractionStatus;
  status: DocumentStatus;
  extractedFields?: Prisma.JsonValue | null;
  mimeType?: string | null;
}) {
  const fields = document.extractedFields as DocumentStructuredFields | null;

  if (document.status === DocumentStatus.NEEDS_REVIEW) {
    return fields?.exceptions?.[0] ?? "Human review required before downstream use.";
  }

  if (document.extractionStatus === DocumentExtractionStatus.FAILED) {
    return document.mimeType === "application/pdf"
      ? "PDF needs OCR/PDF provider or manual review."
      : "Previous extraction failed; retry or review manually.";
  }

  if (document.extractionStatus === DocumentExtractionStatus.PENDING) {
    return "Extraction is pending or ready to be retried.";
  }

  return "Pending automated extraction.";
}

function getQueuePriority(document: {
  type: string;
  status: DocumentStatus;
  extractionStatus: DocumentExtractionStatus;
}) {
  if (document.status === DocumentStatus.NEEDS_REVIEW) return "High";
  if (["POD", "BOL", "INVOICE"].includes(document.type)) return "High";
  if (document.extractionStatus === DocumentExtractionStatus.FAILED) return "Medium";
  return "Low";
}

function getRelatedLabel(document: {
  load?: {
    loadNumber: number | null;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
  } | null;
  shipper?: { companyName: string } | null;
  carrier?: { companyName: string } | null;
  quoteRequest?: {
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
  } | null;
}) {
  if (document.load) {
    return document.load.loadNumber
      ? `Load #${document.load.loadNumber}`
      : `${document.load.originCity}, ${document.load.originState} to ${document.load.destinationCity}, ${document.load.destinationState}`;
  }

  if (document.quoteRequest) {
    return `${document.quoteRequest.originCity}, ${document.quoteRequest.originState} to ${document.quoteRequest.destinationCity}, ${document.quoteRequest.destinationState}`;
  }

  return (
    document.shipper?.companyName ??
    document.carrier?.companyName ??
    "No related record"
  );
}

function getDocumentReviewHref(document: {
  id: string;
  load?: { id: string } | null;
  quoteRequest?: { id: string } | null;
  shipper?: { companyName: string } | null;
  carrier?: { companyName: string } | null;
}) {
  if (document.load) return `/loads/${document.load.id}?tab=documents`;
  if (document.quoteRequest) return `/quote-requests/${document.quoteRequest.id}`;
  return `/documents#${document.id}`;
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAutomationDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
