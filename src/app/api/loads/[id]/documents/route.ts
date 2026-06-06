import { revalidatePath } from "next/cache";
import { type DocumentType } from "@prisma/client";

import { buildDocumentCreateData, isFileLike } from "@/lib/documents";
import { getCurrentInternalUser } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { documentCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/documents">,
) {
  const { id } = await context.params;
  const formData = await request.formData();

  const rawFile = formData.get("file");
  const uploadedFile = isFileLike(rawFile) ? rawFile : null;
  const derivedFileName = uploadedFile?.name ?? formValue(formData, "fileName");

  const parsed = documentCreateSchema.safeParse({
    type: formValue(formData, "type") ?? "OTHER",
    fileName: derivedFileName,
    fileUrl: formValue(formData, "fileUrl"),
    extractedText: formValue(formData, "extractedText"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please add a document name." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Document validated. Connect DATABASE_URL to persist document records.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true, shipperId: true, carrierId: true, quoteRequestId: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  const currentUser = await getCurrentInternalUser();
  await prisma.document.create({
    data: await buildDocumentCreateData({
      type: input.type as DocumentType,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      extractedText: input.extractedText,
      uploadedFile,
      relations: {
      loadId: load.id,
      shipperId: load.shipperId,
        carrierId: load.carrierId,
        quoteRequestId: load.quoteRequestId,
        uploadedByUserId: currentUser?.id ?? null,
      },
    }),
  });

  if (input.type === "POD") {
    await prisma.$transaction([
      prisma.load.update({
        where: { id: load.id },
        data: { status: "POD_RECEIVED" },
      }),
      prisma.shipmentEvent.create({
        data: {
          loadId: load.id,
          type: "POD_UPLOADED",
          message: `POD document added: ${input.fileName}`,
          occurredAt: new Date(),
        },
      }),
    ]);
  }

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard");

  return Response.json({ message: "Document added to load." });
}
