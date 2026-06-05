import { revalidatePath } from "next/cache";

import { nullableString, optionalDate, splitContactName } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { parseInternalQuoteUpdateFormData } from "@/lib/quote-workflow";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = parseInternalQuoteUpdateFormData(formData);

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required quote details before saving." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote details validated. Connect DATABASE_URL to persist quote updates.",
    });
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { shipper: true, contact: true },
  });

  if (!quote) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const input = parsed.data;
  const contactName = input.contactName
    ? splitContactName(input.contactName)
    : { firstName: quote.contact?.firstName ?? "Shipping", lastName: quote.contact?.lastName ?? null };
  const contact =
    quote.contact ??
    (await prisma.contact.create({
      data: {
        shipperId: quote.shipperId,
        ...contactName,
        email: nullableString(input.email),
        phone: nullableString(input.phone),
        isPrimary: false,
      },
    }));

  await prisma.$transaction([
    prisma.shipper.update({
      where: { id: quote.shipperId },
      data: { companyName: input.companyName },
    }),
    prisma.contact.update({
      where: { id: contact.id },
      data: {
        ...contactName,
        email: nullableString(input.email),
        phone: nullableString(input.phone),
      },
    }),
    prisma.quoteRequest.update({
      where: { id },
      data: {
        contactId: contact.id,
        originCity: input.originCity,
        originState: input.originState.toUpperCase(),
        originAddress: nullableString(input.originAddress),
        destinationCity: input.destinationCity,
        destinationState: input.destinationState.toUpperCase(),
        destinationAddress: nullableString(input.destinationAddress),
        pickupDate: optionalDate(input.pickupDate),
        pickupWindow: nullableString(input.pickupWindow),
        deliveryDate: optionalDate(input.deliveryDate),
        deliveryWindow: nullableString(input.deliveryWindow),
        equipmentType: input.equipmentType,
        commodity: nullableString(input.commodity),
        weight: typeof input.weight === "number" ? input.weight : null,
        palletCount:
          typeof input.palletCount === "number" ? input.palletCount : null,
        pieceCount:
          typeof input.pieceCount === "number" ? input.pieceCount : null,
        dimensions: nullableString(input.dimensions),
        hazmat: input.hazmat,
        temperatureRequirement: nullableString(input.temperatureRequirement),
        appointmentRequired: input.appointmentRequired,
        accessorials: nullableString(input.accessorials),
        customerReference: nullableString(input.customerReference),
        urgency: nullableString(input.urgency),
        intakeChannel: input.intakeChannel || "PHONE",
        quotedByPhone: input.quotedByPhone,
        targetMarginPercent:
          typeof input.targetMarginPercent === "number"
            ? input.targetMarginPercent
            : null,
        pricingNotes: nullableString(input.pricingNotes),
        specialRequirements: nullableString(input.specialRequirements),
        status: input.status ?? quote.status,
      },
    }),
  ]);

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Quote details updated." });
}
