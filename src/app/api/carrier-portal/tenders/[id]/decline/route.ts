import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const CARRIER_COOKIE = "atlanta_freight_carrier";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: tenderId } = await context.params;
  const cookieStore = await cookies();
  const carrierId = cookieStore.get(CARRIER_COOKIE)?.value;

  if (!carrierId || !hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Decline validated (no DB or not logged in)." });
  }

  const tender = await prisma.carrierQuote.findUnique({
    where: { id: tenderId },
    include: { load: true },
  });

  if (!tender || tender.carrierId !== carrierId) {
    return Response.json({ error: "Tender not found or not yours." }, { status: 404 });
  }

  if (!["REQUESTED", "RECEIVED"].includes(tender.status)) {
    return Response.json({ error: "Tender cannot be declined in current state." }, { status: 400 });
  }

  await prisma.carrierQuote.update({
    where: { id: tenderId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/carrier-portal");
  revalidatePath(`/loads/${tender.loadId}`);
  revalidatePath("/carriers");

  return Response.json({ message: "Tender declined." });
}
