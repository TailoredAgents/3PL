import { revalidatePath } from "next/cache";

import {
  formValue,
  nullableString,
  optionalDate,
  splitContactName,
} from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { internalQuoteCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = internalQuoteCreateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    contactName: formValue(formData, "contactName"),
    email: formValue(formData, "email") ?? "",
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    pickupDate: formValue(formData, "pickupDate"),
    equipmentType: formValue(formData, "equipmentType"),
    commodity: formValue(formData, "commodity"),
    weight: formValue(formData, "weight") ?? "",
    specialRequirements: formValue(formData, "specialRequirements"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required quote fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote request validated. Connect DATABASE_URL to persist CRM records.",
    });
  }

  const input = parsed.data;
  const contactName = input.contactName
    ? splitContactName(input.contactName)
    : { firstName: "Shipping", lastName: null };
  const weight = typeof input.weight === "number" ? input.weight : null;

  const shipper = await prisma.shipper.create({
    data: {
      companyName: input.companyName,
      status: "LEAD",
      source: "MANUAL",
      notes: nullableString(input.specialRequirements),
      contacts: {
        create: {
          ...contactName,
          email: nullableString(input.email),
          isPrimary: true,
        },
      },
    },
    include: { contacts: true },
  });

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      shipperId: shipper.id,
      contactId: shipper.contacts[0]?.id,
      originCity: input.originCity,
      originState: input.originState.toUpperCase(),
      destinationCity: input.destinationCity,
      destinationState: input.destinationState.toUpperCase(),
      pickupDate: optionalDate(input.pickupDate),
      equipmentType: input.equipmentType,
      commodity: nullableString(input.commodity),
      weight,
      specialRequirements: nullableString(input.specialRequirements),
      status: "NEW",
    },
  });

  await prisma.lead.create({
    data: {
      shipperId: shipper.id,
      contactId: shipper.contacts[0]?.id,
      source: "MANUAL",
      stage: "QUALIFIED",
      priority: 2,
      notes: `Quote request created for ${quoteRequest.originCity}, ${quoteRequest.originState} to ${quoteRequest.destinationCity}, ${quoteRequest.destinationState}.`,
    },
  });

  revalidatePath("/quote-requests");
  revalidatePath("/leads");
  revalidatePath("/shippers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Quote request created." });
}
