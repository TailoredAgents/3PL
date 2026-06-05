import { revalidatePath } from "next/cache";

import {
  checkboxValue,
  formValue,
  nullableString,
  optionalDate,
} from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { loadCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loadCreateSchema.safeParse({
    shipperCompanyName: formValue(formData, "shipperCompanyName"),
    carrierCompanyName: formValue(formData, "carrierCompanyName"),
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    originAddress: formValue(formData, "originAddress"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    destinationAddress: formValue(formData, "destinationAddress"),
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
    customerRate: formValue(formData, "customerRate"),
    carrierRate: formValue(formData, "carrierRate") ?? "",
    pickupDate: formValue(formData, "pickupDate"),
    pickupWindow: formValue(formData, "pickupWindow"),
    deliveryDate: formValue(formData, "deliveryDate"),
    deliveryWindow: formValue(formData, "deliveryWindow"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required load fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Load validated. Connect DATABASE_URL to persist load records.",
    });
  }

  const input = parsed.data;
  const carrierRate =
    typeof input.carrierRate === "number" ? input.carrierRate : null;
  const weight = typeof input.weight === "number" ? input.weight : null;
  const palletCount =
    typeof input.palletCount === "number" ? input.palletCount : null;
  const pieceCount =
    typeof input.pieceCount === "number" ? input.pieceCount : null;
  const grossProfit =
    carrierRate === null ? null : input.customerRate - carrierRate;

  const existingShipper = await prisma.shipper.findFirst({
    where: { companyName: input.shipperCompanyName },
  });
  const shipper =
    existingShipper ??
    (await prisma.shipper.create({
      data: {
        companyName: input.shipperCompanyName,
        status: "ACTIVE",
        source: "MANUAL",
        notes: nullableString(input.notes),
      },
    }));

  const existingCarrier = input.carrierCompanyName
    ? await prisma.carrier.findFirst({
        where: { companyName: input.carrierCompanyName },
      })
    : null;
  const carrier =
    existingCarrier ??
    (input.carrierCompanyName
      ? await prisma.carrier.create({
          data: {
            companyName: input.carrierCompanyName,
            complianceStatus: "PENDING",
          },
        })
      : null);

  const load = await prisma.load.create({
      data: {
        shipperId: shipper.id,
        carrierId: carrier?.id,
      status: carrier?.complianceStatus === "APPROVED" ? "BOOKED" : "TENDERED",
      originCity: input.originCity,
      originState: input.originState.toUpperCase(),
      originAddress: nullableString(input.originAddress),
      destinationCity: input.destinationCity,
      destinationState: input.destinationState.toUpperCase(),
      destinationAddress: nullableString(input.destinationAddress),
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
      customerRate: input.customerRate,
      carrierRate,
      grossProfit,
      pickupDate: optionalDate(input.pickupDate),
      pickupWindow: nullableString(input.pickupWindow),
      deliveryDate: optionalDate(input.deliveryDate),
      deliveryWindow: nullableString(input.deliveryWindow),
      events: {
        create: {
          type: "LOCATION_UPDATE",
          message: `Load created: ${input.originCity}, ${input.originState.toUpperCase()} to ${input.destinationCity}, ${input.destinationState.toUpperCase()} (${input.equipmentType})`,
          occurredAt: new Date(),
        },
      },
    },
  });

  revalidatePath("/loads");
  revalidatePath(`/loads/${load.id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Load created." });
}
