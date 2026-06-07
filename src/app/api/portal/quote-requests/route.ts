import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { customerAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const shipperId = verifyPortalSessionToken(
    "customer",
    cookieStore.get(customerAuthCookie)?.value,
  );

  if (!shipperId) {
    return Response.json({ error: "Not logged in to portal." }, { status: 401 });
  }

  const formData = await request.formData();
  const originCity = formData.get("originCity") as string;
  const originState = formData.get("originState") as string;
  const destinationCity = formData.get("destinationCity") as string;
  const destinationState = formData.get("destinationState") as string;
  const equipmentType = formData.get("equipmentType") as string || "Dry Van";

  if (!originCity || !originState || !destinationCity || !destinationState) {
    return Response.json({ error: "Origin and destination are required." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Quote request validated (no DB)." });
  }

  // Verify shipper has portal enabled
  const shipper = await prisma.shipper.findUnique({
    where: { id: shipperId },
    select: { portalEnabled: true, companyName: true },
  });

  if (!shipper?.portalEnabled) {
    return Response.json({ error: "Portal access not enabled." }, { status: 403 });
  }

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      shipperId,
      originCity,
      originState,
      destinationCity,
      destinationState,
      equipmentType,
      status: "NEW",
      notes: "Submitted via customer portal",
    },
  });

  revalidatePath("/portal");
  revalidatePath("/quote-requests");

  return Response.json({ message: "Quote request submitted.", id: quoteRequest.id });
}
