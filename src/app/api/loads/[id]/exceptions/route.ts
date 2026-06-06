import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { loadExceptionCreateSchema, loadExceptionUpdateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: loadId } = await context.params;
  const formData = await request.formData();

  const parsed = loadExceptionCreateSchema.safeParse({
    type: formData.get("type"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid exception data." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Exception validated (no DB)." });
  }

  const ex = await prisma.loadException.create({
    data: {
      loadId,
      type: parsed.data.type,
      notes: parsed.data.notes || null,
      status: "OPEN",
    },
  });

  revalidatePath("/tracking");
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Exception created.", exceptionId: ex.id });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: loadId } = await context.params;
  const formData = await request.formData();
  const exceptionId = formData.get("exceptionId") as string;

  if (!exceptionId) {
    return Response.json({ error: "exceptionId required." }, { status: 400 });
  }

  const parsed = loadExceptionUpdateSchema.safeParse({
    status: formData.get("status"),
    ownerUserId: formData.get("ownerUserId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid update data." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Exception update validated (no DB)." });
  }

  const data: Record<string, unknown> = {
    status: parsed.data.status,
    notes: parsed.data.notes || undefined,
    updatedAt: new Date(),
  };

  if (parsed.data.ownerUserId) {
    data.ownerUserId = parsed.data.ownerUserId;
  }

  if (parsed.data.status === "RESOLVED") {
    data.resolvedAt = new Date();
  }

  await prisma.loadException.update({
    where: { id: exceptionId },
    data,
  });

  revalidatePath("/tracking");
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Exception updated." });
}
