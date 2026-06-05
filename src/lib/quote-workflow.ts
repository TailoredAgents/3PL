import { prisma } from "@/lib/prisma";
import {
  checkboxValue,
  formValue,
  nullableString,
  optionalDate,
  splitContactName,
} from "@/lib/server-utils";
import {
  internalQuoteCreateSchema,
  type InternalQuoteCreateInput,
} from "@/lib/validation";

export function parseInternalQuoteFormData(formData: FormData) {
  return internalQuoteCreateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    contactName: formValue(formData, "contactName"),
    email: formValue(formData, "email") ?? "",
    phone: formValue(formData, "phone"),
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    originAddress: formValue(formData, "originAddress"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    destinationAddress: formValue(formData, "destinationAddress"),
    pickupDate: formValue(formData, "pickupDate"),
    pickupWindow: formValue(formData, "pickupWindow"),
    deliveryDate: formValue(formData, "deliveryDate"),
    deliveryWindow: formValue(formData, "deliveryWindow"),
    equipmentType: formValue(formData, "equipmentType"),
    commodity: formValue(formData, "commodity"),
    weight: formValue(formData, "weight") ?? "",
    palletCount: formValue(formData, "palletCount") ?? "",
    pieceCount: formValue(formData, "pieceCount") ?? "",
    dimensions: formValue(formData, "dimensions"),
    hazmat: checkboxValue(formData, "hazmat"),
    temperatureRequirement: formValue(formData, "temperatureRequirement"),
    appointmentRequired: checkboxValue(formData, "appointmentRequired"),
    accessorials: formValue(formData, "accessorials"),
    customerReference: formValue(formData, "customerReference"),
    urgency: formValue(formData, "urgency"),
    intakeChannel: formValue(formData, "intakeChannel") ?? "PHONE",
    quotedByPhone: checkboxValue(formData, "quotedByPhone"),
    targetMarginPercent: formValue(formData, "targetMarginPercent") ?? "",
    pricingNotes: formValue(formData, "pricingNotes"),
    specialRequirements: formValue(formData, "specialRequirements"),
  });
}

export async function createInternalQuoteRequest(input: InternalQuoteCreateInput) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const contactName = input.contactName
    ? splitContactName(input.contactName)
    : { firstName: "Shipping", lastName: null };
  const weight = typeof input.weight === "number" ? input.weight : null;
  const palletCount =
    typeof input.palletCount === "number" ? input.palletCount : null;
  const pieceCount =
    typeof input.pieceCount === "number" ? input.pieceCount : null;
  const targetMarginPercent =
    typeof input.targetMarginPercent === "number"
      ? input.targetMarginPercent
      : null;

  const existingShipper = await prisma.shipper.findFirst({
    where: {
      companyName: {
        equals: input.companyName,
        mode: "insensitive",
      },
    },
    include: { contacts: true },
  });

  const shipper =
    existingShipper ??
    (await prisma.shipper.create({
      data: {
        companyName: input.companyName,
        status: "LEAD",
        source: "MANUAL",
        notes: nullableString(input.specialRequirements),
        contacts: {
          create: {
            ...contactName,
            email: nullableString(input.email),
            phone: nullableString(input.phone),
            isPrimary: true,
          },
        },
      },
      include: { contacts: true },
    }));

  const contact =
    shipper.contacts.find((candidate) => {
      const sameEmail =
        input.email &&
        candidate.email?.toLowerCase() === input.email.toLowerCase();
      const samePhone = input.phone && candidate.phone === input.phone;
      const sameName =
        candidate.firstName.toLowerCase() === contactName.firstName.toLowerCase() &&
        (candidate.lastName ?? null) === contactName.lastName;

      return sameEmail || samePhone || sameName;
    }) ??
    (await prisma.contact.create({
      data: {
        shipperId: shipper.id,
        ...contactName,
        email: nullableString(input.email),
        phone: nullableString(input.phone),
        isPrimary: shipper.contacts.length === 0,
      },
    }));

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      shipperId: shipper.id,
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
      weight,
      palletCount,
      pieceCount,
      dimensions: nullableString(input.dimensions),
      hazmat: input.hazmat,
      temperatureRequirement: nullableString(input.temperatureRequirement),
      appointmentRequired: input.appointmentRequired,
      accessorials: nullableString(input.accessorials),
      customerReference: nullableString(input.customerReference),
      urgency: nullableString(input.urgency),
      intakeChannel: input.intakeChannel || "PHONE",
      quotedByPhone: input.quotedByPhone,
      targetMarginPercent,
      pricingNotes: nullableString(input.pricingNotes),
      specialRequirements: nullableString(input.specialRequirements),
      status: "NEW",
    },
  });

  await prisma.lead.create({
    data: {
      shipperId: shipper.id,
      contactId: contact.id,
      source: "MANUAL",
      stage: "QUALIFIED",
      priority: 2,
      notes: `Quote request created for ${quoteRequest.originCity}, ${quoteRequest.originState} to ${quoteRequest.destinationCity}, ${quoteRequest.destinationState}.`,
    },
  });

  return {
    shipper,
    contact,
    quoteRequest,
  };
}
