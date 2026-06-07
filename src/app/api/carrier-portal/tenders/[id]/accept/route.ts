import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { carrierAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: tenderId } = await context.params;
  const cookieStore = await cookies();
  const carrierId = verifyPortalSessionToken(
    "carrier",
    cookieStore.get(carrierAuthCookie)?.value,
  );

  if (!carrierId) {
    return Response.json({ error: "Not logged in to carrier portal." }, { status: 401 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Carrier offer acceptance validated. Connect DATABASE_URL to persist assignment.",
    });
  }

  const carrierQuote = await prisma.carrierQuote.findUnique({
    where: { id: tenderId },
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

  if (!carrierQuote || carrierQuote.carrierId !== carrierId) {
    return Response.json({ error: "Tender not found or not yours." }, { status: 404 });
  }

  if (!["REQUESTED", "RECEIVED"].includes(carrierQuote.status)) {
    return Response.json({ error: "Tender cannot be accepted in current state." }, { status: 400 });
  }

  const carrier = carrierQuote.carrier;
  if (carrier.complianceStatus !== "APPROVED" || carrier.blockedReason) {
    return Response.json(
      {
        error: carrier.blockedReason
          ? `Carrier is blocked: ${carrier.blockedReason}. Resolve before booking.`
          : "Carrier must be approved before accepting the offer. Contact your broker.",
      },
      { status: 400 },
    );
  }

  const loadId = carrierQuote.loadId;
  const carrierRate = Number(carrierQuote.quotedRate);
  const grossProfit = Number(carrierQuote.load.customerRate) - carrierRate;

  await prisma.$transaction([
    prisma.carrierQuote.updateMany({
      where: {
        loadId,
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
      where: { id: loadId },
      data: {
        carrierId: carrierQuote.carrierId,
        carrierRate,
        grossProfit,
        status: "BOOKED",
      },
    }),
    prisma.carrierSourcingCandidate.updateMany({
      where: {
        loadId,
        carrierId: carrierQuote.carrierId,
      },
      data: { status: "CONVERTED" },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId,
        type: "LOCATION_UPDATE",
        message: `Carrier offer accepted by carrier portal: ${carrier.companyName} at $${carrierRate.toLocaleString()}.`,
        occurredAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/carrier-portal");
  revalidatePath("/loads");
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/carriers");
  revalidatePath(`/carriers/${carrierQuote.carrierId}`);
  revalidatePath("/tracking");
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier offer accepted." });
}
