import { revalidatePath } from "next/cache";

import {
  runDocumentExtraction,
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
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as { extractedText?: string };
      if (typeof json?.extractedText === "string") {
        manualExtractedText = json.extractedText;
      }
    } catch {
      // ignore
    }
  } else {
    try {
      const formData = await request.formData();
      const fromForm = formValue(formData, "extractedText");
      if (typeof fromForm === "string") {
        manualExtractedText = fromForm;
      }
    } catch {
      // no form body (plain trigger)
    }
  }

  const options =
    manualExtractedText !== undefined ? { extractedText: manualExtractedText } : undefined;

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

  const message = options
    ? "Extracted text saved after review."
    : result.status === "COMPLETED"
      ? "Document text extracted."
      : result.status === "PENDING"
        ? "Extraction started."
        : "Extraction completed with issues; review manually.";

  return Response.json({
    message,
    status: result.status,
    extractedText: result.extractedText,
  });
}
