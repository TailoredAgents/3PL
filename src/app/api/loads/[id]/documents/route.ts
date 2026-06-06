import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
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
    select: { id: true, shipperId: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;

  let fileUrl = input.fileUrl;
  if (!fileUrl && uploadedFile) {
    const result = await uploadFile(
      uploadedFile,
      uploadedFile.name,
      uploadedFile.type || "application/octet-stream",
    );
    fileUrl = result.fileUrl;
  }

  await prisma.document.create({
    data: {
      loadId: load.id,
      shipperId: load.shipperId,
      type: input.type,
      fileName: input.fileName,
      fileUrl: fileUrl || `pending-storage://${input.fileName}`,
      extractedText: input.extractedText,
    },
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
  revalidatePath("/dashboard");

  return Response.json({ message: "Document added to load." });
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}
