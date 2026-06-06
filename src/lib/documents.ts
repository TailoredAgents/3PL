import {
  DocumentExtractionStatus,
  DocumentSource,
  DocumentStatus,
  type DocumentType,
} from "@prisma/client";

import { uploadFile, type UploadFileResult } from "@/lib/storage";

export const documentTypeOptions: DocumentType[] = [
  "BOL",
  "POD",
  "RATE_CONFIRMATION",
  "INVOICE",
  "AUDIT_UPLOAD",
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
    extractionStatus: extractedText
      ? DocumentExtractionStatus.COMPLETED
      : DocumentExtractionStatus.NOT_REQUESTED,
    extractedText: extractedText || null,
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
