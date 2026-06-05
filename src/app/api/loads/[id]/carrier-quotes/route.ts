import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { carrierQuoteCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/carrier-quotes">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = carrierQuoteCreateSchema.safeParse({
    carrierCompanyName: formValue(formData, "carrierCompanyName"),
    quotedRate: formValue(formData, "quotedRate"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a carrier and quoted rate." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier offer validated. Connect DATABASE_URL to persist carrier quotes.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  const carrier = await findOrCreateCarrier(input.carrierCompanyName);

  await prisma.$transaction([
    prisma.carrierQuote.create({
      data: {
        loadId: load.id,
        carrierId: carrier.id,
        quotedRate: input.quotedRate,
        status: "RECEIVED",
        notes: nullableString(input.notes),
      },
    }),
    prisma.carrierSourcingCandidate.updateMany({
      where: {
        loadId: load.id,
        OR: [
          { carrierId: carrier.id },
          {
            companyName: {
              equals: carrier.companyName,
              mode: "insensitive",
            },
          },
        ],
      },
      data: {
        carrierId: carrier.id,
        status: "OFFER_RECEIVED",
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `Carrier offer received from ${carrier.companyName}: $${input.quotedRate.toLocaleString()}.`,
        occurredAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/carriers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier offer saved." });
}

async function findOrCreateCarrier(companyName: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const existing = await prisma.carrier.findFirst({
    where: {
      companyName: {
        equals: companyName,
        mode: "insensitive",
      },
    },
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
