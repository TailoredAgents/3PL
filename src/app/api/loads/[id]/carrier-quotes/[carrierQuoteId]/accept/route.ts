import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/loads/[id]/carrier-quotes/[carrierQuoteId]/accept">,
) {
  const { id, carrierQuoteId } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier offer acceptance validated. Connect DATABASE_URL to persist assignment.",
    });
  }

  const carrierQuote = await prisma.carrierQuote.findUnique({
    where: { id: carrierQuoteId },
    include: {
      carrier: true,
      load: {
        select: {
          id: true,
          customerRate: true,
        },
      },
    },
  });

  if (!carrierQuote || carrierQuote.loadId !== id) {
    return Response.json({ error: "Carrier offer not found." }, { status: 404 });
  }

  const carrierRate = Number(carrierQuote.quotedRate);
  const grossProfit = Number(carrierQuote.load.customerRate) - carrierRate;

  await prisma.$transaction([
    prisma.carrierQuote.updateMany({
      where: {
        loadId: id,
        id: { not: carrierQuote.id },
        status: { in: ["REQUESTED", "RECEIVED"] },
      },
      data: { status: "REJECTED" },
    }),
    prisma.carrierQuote.update({
      where: { id: carrierQuote.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.load.update({
      where: { id },
      data: {
        carrierId: carrierQuote.carrierId,
        carrierRate,
        grossProfit,
        status: "BOOKED",
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId: id,
        type: "LOCATION_UPDATE",
        message: `Carrier offer accepted: ${carrierQuote.carrier.companyName} at $${carrierRate.toLocaleString()}.`,
        occurredAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/carriers");
  revalidatePath(`/carriers/${carrierQuote.carrierId}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier offer accepted." });
}
