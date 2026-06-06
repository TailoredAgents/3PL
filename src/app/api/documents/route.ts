import { revalidatePath } from "next/cache";
import { DocumentSource, type DocumentType } from "@prisma/client";

import {
  buildDocumentCreateData,
  isFileLike,
  type DocumentRelationInput,
} from "@/lib/documents";
import { getCurrentInternalUser } from "@/lib/current-user";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { documentCreateSchema } from "@/lib/validation";

type RelatedEntityType =
  | "LOAD"
  | "SHIPPER"
  | "QUOTE_REQUEST"
  | "CARRIER"
  | "SAVINGS_AUDIT";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawFile = formData.get("file");
  const uploadedFile = isFileLike(rawFile) ? rawFile : null;
  const derivedFileName = uploadedFile?.name ?? formValue(formData, "fileName");
  const relatedEntityType = formValue(formData, "relatedEntityType") as
    | RelatedEntityType
    | undefined;
  const relatedEntityId = formValue(formData, "relatedEntityId");

  const parsed = documentCreateSchema.safeParse({
    type: formValue(formData, "type") ?? "OTHER",
    fileName: derivedFileName,
    fileUrl: formValue(formData, "fileUrl"),
    extractedText: formValue(formData, "extractedText"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please add a document name and type." },
      { status: 400 },
    );
  }

  if (!relatedEntityType || !relatedEntityId) {
    return Response.json(
      { error: "Choose the record this document belongs to." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Document validated. Connect DATABASE_URL to persist document records.",
    });
  }

  const relations = await resolveDocumentRelations(
    relatedEntityType,
    relatedEntityId,
  );

  if (!relations) {
    return Response.json({ error: "Related record not found." }, { status: 404 });
  }

  const currentUser = await getCurrentInternalUser();
  const input = parsed.data;
  const documentData = await buildDocumentCreateData({
    type: input.type as DocumentType,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    extractedText: input.extractedText,
    uploadedFile,
    source: uploadedFile ? DocumentSource.MANUAL_UPLOAD : undefined,
    relations: {
      ...relations,
      uploadedByUserId: currentUser?.id ?? null,
    },
  });

  const document = await prisma.document.create({ data: documentData });

  revalidateDocumentPaths(document);

  return Response.json({
    message: "Document added.",
    documentId: document.id,
  });
}

async function resolveDocumentRelations(
  relatedEntityType: RelatedEntityType,
  relatedEntityId: string,
): Promise<DocumentRelationInput | null> {
  if (!prisma) return null;

  if (relatedEntityType === "LOAD") {
    const load = await prisma.load.findUnique({
      where: { id: relatedEntityId },
      select: { id: true, shipperId: true, carrierId: true, quoteRequestId: true },
    });
    return load
      ? {
          loadId: load.id,
          shipperId: load.shipperId,
          carrierId: load.carrierId,
          quoteRequestId: load.quoteRequestId,
        }
      : null;
  }

  if (relatedEntityType === "SHIPPER") {
    const shipper = await prisma.shipper.findUnique({
      where: { id: relatedEntityId },
      select: { id: true },
    });
    return shipper ? { shipperId: shipper.id } : null;
  }

  if (relatedEntityType === "QUOTE_REQUEST") {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: relatedEntityId },
      select: { id: true, shipperId: true },
    });
    return quote
      ? { quoteRequestId: quote.id, shipperId: quote.shipperId }
      : null;
  }

  if (relatedEntityType === "CARRIER") {
    const carrier = await prisma.carrier.findUnique({
      where: { id: relatedEntityId },
      select: { id: true },
    });
    return carrier ? { carrierId: carrier.id } : null;
  }

  if (relatedEntityType === "SAVINGS_AUDIT") {
    const audit = await prisma.savingsAudit.findUnique({
      where: { id: relatedEntityId },
      select: { id: true, shipperId: true },
    });
    return audit
      ? { savingsAuditId: audit.id, shipperId: audit.shipperId }
      : null;
  }

  return null;
}

function revalidateDocumentPaths(document: {
  shipperId: string | null;
  loadId: string | null;
  quoteRequestId: string | null;
  carrierId: string | null;
}) {
  revalidatePath("/documents");
  revalidatePath("/dashboard");

  if (document.shipperId) revalidatePath(`/shippers/${document.shipperId}`);
  if (document.loadId) {
    revalidatePath("/loads");
    revalidatePath(`/loads/${document.loadId}`);
  }
  if (document.quoteRequestId) {
    revalidatePath("/quote-requests");
    revalidatePath(`/quote-requests/${document.quoteRequestId}`);
  }
  if (document.carrierId) revalidatePath(`/carriers/${document.carrierId}`);
}
