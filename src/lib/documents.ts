import {
  DocumentExtractionStatus,
  DocumentSource,
  DocumentStatus,
  type DocumentType,
} from "@prisma/client";

import { uploadFile, downloadStoredFile, type UploadFileResult } from "@/lib/storage";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { runDocumentStructuredExtraction, type DocumentStructuredFields } from "@/lib/grok";
import { Prisma } from "@prisma/client";
export type { DocumentStructuredFields } from "@/lib/grok";

export const documentTypeOptions: DocumentType[] = [
  "BOL",
  "POD",
  "RATE_CONFIRMATION",
  "INVOICE",
  "AUDIT_UPLOAD",
  "W9",
  "CERTIFICATE_OF_INSURANCE",
  "BROKER_CARRIER_AGREEMENT",
  "OTHER",
];

export type DocumentRelationInput = {
  shipperId?: string | null;
  loadId?: string | null;
  quoteRequestId?: string | null;
  carrierId?: string | null;
  savingsAuditId?: string | null;
  uploadedByUserId?: string | null;
};

export type DocumentCreateData = DocumentRelationInput & {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  storageKey: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: DocumentStatus;
  source: DocumentSource;
  extractionStatus: DocumentExtractionStatus;
  extractedText?: string | null;
};

export function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

export async function buildDocumentCreateData({
  type,
  fileName,
  fileUrl,
  extractedText,
  uploadedFile,
  source,
  relations,
}: {
  type: DocumentType;
  fileName: string;
  fileUrl?: string | null;
  extractedText?: string | null;
  uploadedFile?: File | null;
  source?: DocumentSource;
  relations: DocumentRelationInput;
}): Promise<DocumentCreateData> {
  const uploadResult = uploadedFile
    ? await uploadFile(
        uploadedFile,
        uploadedFile.name,
        uploadedFile.type || "application/octet-stream",
      )
    : null;
  const resolvedFileUrl =
    fileUrl || uploadResult?.fileUrl || `pending-storage://${fileName}`;
  const resolvedSource =
    source ??
    (uploadResult
      ? DocumentSource.MANUAL_UPLOAD
      : fileUrl
        ? DocumentSource.EXTERNAL_URL
        : DocumentSource.MANUAL_UPLOAD);

  // Prefer explicit extractedText (manual notes at upload).
  // Otherwise auto-extract for plain text files when the File is available.
  let resolvedExtractedText = extractedText || null;
  let resolvedExtractionStatus: DocumentExtractionStatus = extractedText
    ? DocumentExtractionStatus.COMPLETED
    : DocumentExtractionStatus.NOT_REQUESTED;

  if (!resolvedExtractedText && uploadedFile) {
    const candidateMime =
      uploadResult?.mimeType ??
      uploadedFile.type ??
      inferMimeType(fileName);
    if (isTextExtractableMime(candidateMime, fileName)) {
      try {
        const raw = await uploadedFile.text();
        const trimmed = raw.trim().slice(0, 200000);
        if (trimmed) {
          resolvedExtractedText = trimmed;
          resolvedExtractionStatus = DocumentExtractionStatus.COMPLETED;
        }
      } catch {
        // Leave as NOT_REQUESTED; caller can request later or paste text.
      }
    }
  }

  return {
    ...relations,
    type,
    fileName,
    fileUrl: resolvedFileUrl,
    storageKey: uploadResult?.storageKey ?? null,
    mimeType:
      uploadResult?.mimeType ??
      uploadedFile?.type ??
      inferMimeType(fileName),
    fileSize: uploadResult?.fileSize ?? uploadedFile?.size ?? null,
    status: getDocumentStatus(resolvedFileUrl, uploadResult),
    source: resolvedSource,
    extractionStatus: resolvedExtractionStatus,
    extractedText: resolvedExtractedText,
  };
}

export function getDocumentDownloadHref(documentId: string) {
  return `/api/documents/${documentId}/download`;
}

export function formatFileSize(fileSize: number | null | undefined) {
  if (!fileSize) return "Size unknown";
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentStatus(
  fileUrl: string,
  uploadResult: UploadFileResult | null,
): DocumentStatus {
  if (fileUrl.startsWith("pending-storage://")) {
    return DocumentStatus.MISSING_STORAGE;
  }

  if (uploadResult && !uploadResult.uploaded) {
    return DocumentStatus.MISSING_STORAGE;
  }

  return DocumentStatus.ACTIVE;
}

function inferMimeType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".txt")) return "text/plain";
  return null;
}

export function isTextExtractableMime(mimeType: string | null, fileName: string): boolean {
  const lower = (fileName || "").toLowerCase();
  if (mimeType) {
    if (mimeType.startsWith("text/") || mimeType === "application/csv") {
      return true;
    }
  }
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".log") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json")
  );
}

export async function extractTextFromBytes(
  bytes: Uint8Array | Buffer | ArrayBuffer,
  mimeType: string | null,
  fileName: string,
): Promise<{ text: string | null; status: DocumentExtractionStatus; error?: string }> {
  const buf = bytes instanceof Uint8Array ? bytes : Buffer.from(bytes as ArrayBuffer);
  if (isTextExtractableMime(mimeType, fileName)) {
    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return {
        text: text.trim().slice(0, 200000),
        status: DocumentExtractionStatus.COMPLETED,
      };
    } catch {
      return {
        text: null,
        status: DocumentExtractionStatus.FAILED,
        error: "Failed to decode text content from file.",
      };
    }
  }

  const lower = fileName.toLowerCase();
  const isPdfOrImage =
    (mimeType && (mimeType === "application/pdf" || mimeType.startsWith("image/"))) ||
    lower.endsWith(".pdf") ||
    lower.match(/\.(png|jpe?g|webp|gif)$/i);

  if (isPdfOrImage) {
    return {
      text: null,
      status: DocumentExtractionStatus.FAILED,
      error:
        "PDF/image text extraction requires an OCR or vision provider. Use the manual notes field at upload or the review action after upload.",
    };
  }

  return {
    text: null,
    status: DocumentExtractionStatus.FAILED,
    error: `Automatic extraction not supported for ${mimeType || "this file type"}. Paste text manually via upload form or review.`,
  };
}

export async function runDocumentExtraction(
  documentId: string,
  options?: {
    extractedText?: string | null;
    extractedFields?: DocumentStructuredFields | null;
  },
): Promise<{
  status: DocumentExtractionStatus;
  extractedText: string | null;
  extractedFields?: DocumentStructuredFields | null;
  error?: string;
}> {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      status: DocumentExtractionStatus.FAILED,
      extractedText: null,
      error: "Database is not configured.",
    };
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      storageKey: true,
      fileUrl: true,
      extractedText: true,
      extractedFields: true,
      type: true,
    },
  });

  if (!doc) {
    return {
      status: DocumentExtractionStatus.FAILED,
      extractedText: null,
      error: "Document not found.",
    };
  }

  // Manual/review path for text or structured fields (human review gate)
  if (options && (Object.prototype.hasOwnProperty.call(options, "extractedText") || Object.prototype.hasOwnProperty.call(options, "extractedFields"))) {
    const text = options.extractedText !== undefined ? options.extractedText : doc.extractedText;
    const fields = options.extractedFields !== undefined ? options.extractedFields : (doc.extractedFields as DocumentStructuredFields | null);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractionStatus: DocumentExtractionStatus.COMPLETED,
        extractedText: text,
        extractedFields: fields ?? Prisma.JsonNull,
      },
    });
    return {
      status: DocumentExtractionStatus.COMPLETED,
      extractedText: text,
      extractedFields: fields
    };
  }

  // Auto-extraction path (text + structured when possible)
  await prisma.document.update({
    where: { id: documentId },
    data: { extractionStatus: DocumentExtractionStatus.PENDING },
  });

  let finalStatus: DocumentExtractionStatus = DocumentExtractionStatus.FAILED;
  let finalText: string | null = null;
  let finalFields: DocumentStructuredFields | null = null;
  let extractionError: string | undefined;

  try {
    let bytesForVision: Uint8Array | null = null;

    if (doc.storageKey) {
      const stored = await downloadStoredFile(doc.storageKey);
      const { text, status, error } = await extractTextFromBytes(
        stored.body,
        doc.mimeType,
        doc.fileName,
      );
      finalStatus = status;
      finalText = text;
      extractionError = error;

      // Prepare for vision if this is an image type (PDFs rely more on prior text or future image conversion)
      const isImageType = doc.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName);
      if (isImageType) {
        bytesForVision = stored.body;
      }
    } else if (doc.extractedText) {
      finalStatus = DocumentExtractionStatus.COMPLETED;
      finalText = doc.extractedText;
    } else if (isTextExtractableMime(doc.mimeType, doc.fileName)) {
      finalStatus = DocumentExtractionStatus.FAILED;
      extractionError =
        "Plain text file was uploaded without durable storage; extraction cannot recover original bytes.";
    } else {
      finalStatus = DocumentExtractionStatus.FAILED;
      extractionError =
        "No stored file available. Configure storage for full auto extraction of images/PDFs.";
    }

    // Attempt structured extraction using LLM (text always, vision for images when we have bytes + keys)
    if (finalText || bytesForVision) {
      let imageBase64: string | null = null;
      if (bytesForVision) {
        const b64 = Buffer.from(bytesForVision).toString("base64");
        const mime = doc.mimeType || "image/jpeg";
        imageBase64 = `data:${mime};base64,${b64}`;
      }

      const structured = await runDocumentStructuredExtraction({
        documentType: doc.type,
        extractedText: finalText,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        imageBase64,
      });

      finalFields = structured.fields;
      // If we got good structured data, consider the overall extraction successful even if raw text was partial
      if (Object.keys(finalFields).length > 0 && structured.confidence > 0.3) {
        if (finalStatus !== DocumentExtractionStatus.COMPLETED) {
          finalStatus = DocumentExtractionStatus.COMPLETED;
        }
      }
    }
  } catch (err) {
    finalStatus = DocumentExtractionStatus.FAILED;
    extractionError = err instanceof Error ? err.message : "Unexpected extraction error.";
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      extractionStatus: finalStatus,
      extractedText: finalText,
      extractedFields: finalFields ?? Prisma.JsonNull,
    },
  });

  return {
    status: finalStatus,
    extractedText: finalText,
    extractedFields: finalFields,
    error: extractionError,
  };
}
