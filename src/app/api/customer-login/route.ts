import { NextResponse } from "next/server";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const CUSTOMER_COOKIE = "atlanta_freight_customer";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string || "").toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return NextResponse.json({ message: "Portal login simulated (no DB)." });
  }

  // Find enabled CustomerAccount or matching contact on portalEnabled shipper
  const account = await prisma.customerAccount.findFirst({
    where: { email, enabled: true, shipper: { portalEnabled: true } },
    include: { shipper: true },
  });

  let shipperId: string | null = account?.shipperId ?? null;

  if (!shipperId) {
    const contact = await prisma.contact.findFirst({
      where: {
        email,
        shipper: { portalEnabled: true },
      },
      select: { shipperId: true },
    });
    shipperId = contact?.shipperId ?? null;
  }

  if (!shipperId) {
    return NextResponse.json({ error: "No matching enabled portal account or contact found." }, { status: 404 });
  }

  const res = NextResponse.json({ message: "Logged in to portal.", redirectTo: "/portal" });
  res.cookies.set(CUSTOMER_COOKIE, shipperId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}