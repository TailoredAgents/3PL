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
    return Response.json({ message: "Decline validated. Connect DATABASE_URL to persist." });
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
