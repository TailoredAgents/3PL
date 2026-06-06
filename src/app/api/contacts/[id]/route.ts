import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { contactUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();

  const parsed = contactUpdateSchema.safeParse({
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    title: formValue(formData, "title"),
    email: formValue(formData, "email") ?? "",
    phone: formValue(formData, "phone"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "First name is required." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Contact validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const contact = await prisma.contact.findUnique({
    where: { id },
    select: { id: true, shipperId: true },
  });

  if (!contact) {
    return Response.json({ error: "Contact not found." }, { status: 404 });
  }

  const input = parsed.data;

  await prisma.contact.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: nullableString(input.lastName),
      title: nullableString(input.title),
      email: nullableString(input.email),
      phone: nullableString(input.phone),
    },
  });

  revalidatePath(`/contacts/${id}`);
  revalidatePath(`/shippers/${contact.shipperId}`);
  revalidatePath("/shippers");

  return Response.json({ message: "Contact updated." });
}
