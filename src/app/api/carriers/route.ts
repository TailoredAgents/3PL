import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { carrierCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = carrierCreateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    mcNumber: formValue(formData, "mcNumber"),
    dotNumber: formValue(formData, "dotNumber"),
    contactName: formValue(formData, "contactName"),
    phone: formValue(formData, "phone"),
    email: formValue(formData, "email") ?? "",
    complianceStatus: formValue(formData, "complianceStatus") ?? "PENDING",
    preferredLanes: formValue(formData, "preferredLanes"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required carrier fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier validated. Connect DATABASE_URL to persist carrier records.",
    });
  }

  const input = parsed.data;
  await prisma.carrier.create({
    data: {
      companyName: input.companyName,
      mcNumber: nullableString(input.mcNumber),
      dotNumber: nullableString(input.dotNumber),
      contactName: nullableString(input.contactName),
      phone: nullableString(input.phone),
      email: nullableString(input.email),
      complianceStatus: input.complianceStatus,
      preferredLanes: input.preferredLanes
        ? input.preferredLanes.split(";").map((lane) => lane.trim())
        : undefined,
      notes: nullableString(input.notes),
    },
  });

  revalidatePath("/carriers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier created." });
}
