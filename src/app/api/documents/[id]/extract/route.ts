import { revalidatePath } from "next/cache";

import {
  runDocumentExtraction,
  type DocumentStructuredFields,
} from "@/lib/documents";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Document extraction validated. Connect DATABASE_URL to persist.",
    });
  }

  // Support both FormData (from existing submit helpers and review forms) and JSON.
  let manualExtractedText: string | undefined;
  let manualExtractedFields: DocumentStructuredFields | undefined;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as {
        extractedText?: string;
        extractedFields?: DocumentStructuredFields;
      };
      if (typeof json?.extractedText === "string") manualExtractedText = json.extractedText;
      if (json?.extractedFields && typeof json.extractedFields === "object") {
        manualExtractedFields = json.extractedFields;
      }
    } catch {
      // ignore
    }
  } else {
    try {
      const formData = await request.formData();
      const fromFormText = formValue(formData, "extractedText");
      if (typeof fromFormText === "string") manualExtractedText = fromFormText;

      // For structured, prefer JSON body in review forms for complex objects; simple string fallback if needed
      const fieldsRaw = formValue(formData, "extractedFields");
      if (fieldsRaw) {
        try { manualExtractedFields = JSON.parse(fieldsRaw); } catch {}
      }
    } catch {
      // no form body (plain trigger)
    }
  }

  const options: { extractedText?: string; extractedFields?: DocumentStructuredFields } = {};
  if (manualExtractedText !== undefined) options.extractedText = manualExtractedText;
  if (manualExtractedFields !== undefined) options.extractedFields = manualExtractedFields;

  const result = await runDocumentExtraction(id, options);

  // Revalidate document center and any linked records.
  revalidatePath("/documents");
  revalidatePath("/dashboard");

  // Best-effort: revalidate related entity pages if we can resolve them.
  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        loadId: true,
        shipperId: true,
        carrierId: true,
        quoteRequestId: true,
      },
    });
    if (doc) {
      if (doc.loadId) {
        revalidatePath("/loads");
        revalidatePath(`/loads/${doc.loadId}`);
      }
      if (doc.shipperId) revalidatePath(`/shippers/${doc.shipperId}`);
      if (doc.carrierId) revalidatePath(`/carriers/${doc.carrierId}`);
      if (doc.quoteRequestId) {
        revalidatePath("/quote-requests");
        revalidatePath(`/quote-requests/${doc.quoteRequestId}`);
      }
    }
  } catch {
    // non-fatal
  }

  if (result.error && result.status === "FAILED") {
    return Response.json(
      { error: result.error || "Document extraction failed." },
      { status: 500 },
    );
  }

  const isManual = options && (options.extractedText !== undefined || options.extractedFields !== undefined);
  const message = isManual
    ? "Reviewed text and/or structured fields saved."
    : result.status === "COMPLETED"
      ? "Document text and structured fields extracted."
      : result.status === "PENDING"
        ? "Extraction started."
        : "Extraction completed with issues; review manually.";

  return Response.json({
    message,
    status: result.status,
    extractedText: result.extractedText,
    extractedFields: result.extractedFields,
  });
}
