import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DocumentSource, type DocumentType } from "@prisma/client";

import {
  buildDocumentCreateData,
  isFileLike,
} from "@/lib/documents";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";

const CARRIER_COOKIE = "atlanta_freight_carrier";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const carrierId = cookieStore.get(CARRIER_COOKIE)?.value;

  if (!carrierId) {
    return Response.json({ error: "Not logged in to carrier portal." }, { status: 401 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  const uploadedFile = isFileLike(rawFile) ? rawFile : null;
  const derivedFileName = uploadedFile?.name ?? formValue(formData, "fileName");
  const type = (formValue(formData, "type") ?? "OTHER") as DocumentType;
  const loadId = formValue(formData, "loadId") || undefined;

  if (!uploadedFile && !formValue(formData, "fileUrl")) {
    return Response.json({ error: "Please provide a file or file URL." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Document upload simulated (no DB)." });
  }

  // Verify carrier exists
  const carrier = await prisma.carrier.findUnique({ where: { id: carrierId } });
  if (!carrier) {
    return Response.json({ error: "Carrier not found." }, { status: 404 });
  }

  const relations: Record<string, string> = {
    carrierId,
  };
  if (loadId) {
    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (load && load.carrierId === carrierId) {
      relations.loadId = loadId;
    }
  }

  const documentData = await buildDocumentCreateData({
    type,
    fileName: derivedFileName || "uploaded-document",
    fileUrl: formValue(formData, "fileUrl"),
    uploadedFile,
    source: DocumentSource.MANUAL_UPLOAD,
    relations,
  });

  const document = await prisma.document.create({ data: documentData });

  // Revalidate relevant paths
  revalidatePath("/carrier-portal");
  revalidatePath("/documents");
  if (loadId) revalidatePath(`/loads/${loadId}`);
  revalidatePath(`/carriers/${carrierId}`);

  return Response.json({
    message: "Document uploaded successfully and added to Document Center.",
    documentId: document.id,
  });
}
