import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();

  const firstName = formValue(formData, "firstName");
  if (!firstName) {
    return Response.json({ error: "First name is required." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Contact validated. Connect DATABASE_URL to persist.",
    });
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!shipper) {
    return Response.json({ error: "Shipper not found." }, { status: 404 });
  }

  const isPrimary = formData.get("isPrimary") === "true";

  if (isPrimary) {
    await prisma.contact.updateMany({
      where: { shipperId: id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  await prisma.contact.create({
    data: {
      shipperId: id,
      firstName,
      lastName: nullableString(formValue(formData, "lastName")),
      title: nullableString(formValue(formData, "title")),
      email: nullableString(formValue(formData, "email")),
      phone: nullableString(formValue(formData, "phone")),
      isPrimary,
    },
  });

  revalidatePath(`/shippers/${id}`);
  revalidatePath("/shippers");

  return Response.json({ message: "Contact added." });
}
