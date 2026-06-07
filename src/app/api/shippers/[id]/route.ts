import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { shipperUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();

  const parsed = shipperUpdateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    industry: formValue(formData, "industry"),
    website: formValue(formData, "website"),
    status: formValue(formData, "status"),
    notes: formValue(formData, "notes"),
    portalEnabled: formValue(formData, "portalEnabled") === "on" || formValue(formData, "portalEnabled") === "true",
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Company name is required." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Shipper validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const input = parsed.data;

  const shipper = await prisma.shipper.findUnique({ where: { id } });
  if (!shipper) {
    return Response.json({ error: "Shipper not found." }, { status: 404 });
  }

  await prisma.shipper.update({
    where: { id },
    data: {
      companyName: input.companyName,
      industry: nullableString(input.industry),
      website: nullableString(input.website),
      status: input.status ?? shipper.status,
      notes: nullableString(input.notes),
      portalEnabled: input.portalEnabled ?? shipper.portalEnabled,
    },
  });

  revalidatePath("/shippers");
  revalidatePath(`/shippers/${id}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return Response.json({ message: "Shipper updated." });
}
