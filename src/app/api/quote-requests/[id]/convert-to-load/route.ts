import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { quoteConvertSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/quote-requests/[id]/convert-to-load">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = quoteConvertSchema.safeParse({
    customerRate: formValue(formData, "customerRate"),
    carrierCompanyName: formValue(formData, "carrierCompanyName"),
    carrierRate: formValue(formData, "carrierRate") ?? "",
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter at least a customer rate to convert this quote." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote conversion validated. Connect DATABASE_URL to create the load.",
    });
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
  });

  if (!quote) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const input = parsed.data;
  const carrierRate =
    typeof input.carrierRate === "number" ? input.carrierRate : null;
  const carrier = input.carrierCompanyName
    ? await findOrCreateCarrier(input.carrierCompanyName)
    : null;

  const load = await prisma.load.create({
    data: {
      quoteRequestId: quote.id,
      shipperId: quote.shipperId,
      carrierId: carrier?.id,
      status: carrier ? "BOOKED" : "TENDERED",
      originCity: quote.originCity,
      originState: quote.originState,
      destinationCity: quote.destinationCity,
      destinationState: quote.destinationState,
      equipmentType: quote.equipmentType,
      commodity: quote.commodity,
      weight: quote.weight,
      customerRate: input.customerRate,
      carrierRate,
      grossProfit:
        carrierRate === null ? null : input.customerRate - carrierRate,
      pickupDate: quote.pickupDate,
      deliveryDate: quote.deliveryDate,
      events: {
        create: {
          type: "LOCATION_UPDATE",
          message: "Load created from quote request.",
          occurredAt: new Date(),
        },
      },
    },
  });

  await prisma.quoteRequest.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/loads");
  revalidatePath(`/loads/${load.id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Quote converted to load." });
}

async function findOrCreateCarrier(companyName: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const existing = await prisma.carrier.findFirst({
    where: { companyName },
  });

  if (existing) {
    return existing;
  }

  return prisma.carrier.create({
    data: {
      companyName,
      complianceStatus: "PENDING",
    },
  });
}
