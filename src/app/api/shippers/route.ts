import { revalidatePath } from "next/cache";

import {
  composeShipperNotes,
  formValue,
  nullableString,
  splitContactName,
} from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { shipperCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = shipperCreateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    industry: formValue(formData, "industry"),
    website: formValue(formData, "website"),
    contactName: formValue(formData, "contactName"),
    title: formValue(formData, "title"),
    email: formValue(formData, "email") ?? "",
    phone: formValue(formData, "phone"),
    lanes: formValue(formData, "lanes"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required shipper fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Shipper validated. Connect DATABASE_URL to persist CRM records.",
    });
  }

  const input = parsed.data;
  const contactName = splitContactName(input.contactName);

  await prisma.shipper.create({
    data: {
      companyName: input.companyName,
      industry: nullableString(input.industry),
      website: nullableString(input.website),
      status: "LEAD",
      source: "MANUAL",
      notes:
        composeShipperNotes({
          lanes: input.lanes,
          notes: input.notes,
        }) || nullableString(input.notes),
      contacts: {
        create: {
          ...contactName,
          title: nullableString(input.title),
          email: nullableString(input.email),
          phone: nullableString(input.phone),
          isPrimary: true,
        },
      },
    },
  });

  revalidatePath("/shippers");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return Response.json({ message: "Shipper and primary contact created." });
}
