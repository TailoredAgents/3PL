import { revalidatePath } from "next/cache";

import { formValue, nullableString, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { loadCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loadCreateSchema.safeParse({
    shipperCompanyName: formValue(formData, "shipperCompanyName"),
    carrierCompanyName: formValue(formData, "carrierCompanyName"),
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    equipmentType: formValue(formData, "equipmentType"),
    customerRate: formValue(formData, "customerRate"),
    carrierRate: formValue(formData, "carrierRate") ?? "",
    pickupDate: formValue(formData, "pickupDate"),
    deliveryDate: formValue(formData, "deliveryDate"),
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
      status: carrier ? "BOOKED" : "TENDERED",
      originCity: input.originCity,
      originState: input.originState.toUpperCase(),
      destinationCity: input.destinationCity,
      destinationState: input.destinationState.toUpperCase(),
      equipmentType: input.equipmentType,
      customerRate: input.customerRate,
      carrierRate,
      grossProfit,
      pickupDate: optionalDate(input.pickupDate),
      deliveryDate: optionalDate(input.deliveryDate),
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
