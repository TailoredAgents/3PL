import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const lanes = formValue(formData, "lanes") ?? "";

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Lanes validated. Connect DATABASE_URL to persist.",
    });
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id },
    select: { id: true, notes: true },
  });

  if (!shipper) {
    return Response.json({ error: "Shipper not found." }, { status: 404 });
  }

  const currentNotes = shipper.notes ?? "";
  const updatedNotes = setNotesField(currentNotes, "Lanes", lanes);

  await prisma.shipper.update({
    where: { id },
    data: { notes: updatedNotes || null },
  });

  revalidatePath(`/shippers/${id}`);
  revalidatePath("/shippers");

  return Response.json({ message: "Lanes updated." });
}

function setNotesField(notes: string, field: string, value: string): string {
  const prefix = `${field}:`;
  const lines = notes.split("\n");
  const idx = lines.findIndex((l) => l.trim().startsWith(prefix));

  if (!value) {
    if (idx >= 0) lines.splice(idx, 1);
    return lines.join("\n").trim();
  }

  const newLine = `${prefix} ${value}`;
  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    lines.push(newLine);
  }
  return lines.join("\n").trim();
}
