import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { carrierAuthCookie } from "@/lib/auth";
import { createPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string || "").toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!hasDatabaseUrl() || !prisma) {
    return NextResponse.json({ message: "Carrier login simulated (no DB)." });
  }

  // Find carrier by direct email or in additionalContacts JSON (array of {email, name, phone?})
  // additionalContacts is Json; fetch candidates and filter in JS (small dataset)
  const carriers = await prisma.carrier.findMany({
    where: {
      OR: [
        { email: { not: null } },
        { additionalContacts: { not: null } },
      ],
    } as Record<string, unknown>,
    select: {
      id: true,
      companyName: true,
      complianceStatus: true,
      email: true,
      additionalContacts: true,
    },
    take: 500,
  });

  const matching = carriers.find((c) => {
    if (c.email?.toLowerCase() === email) return true;
    if (c.additionalContacts) {
      try {
        const arr = Array.isArray(c.additionalContacts) ? c.additionalContacts : JSON.parse(c.additionalContacts as string);
        return Array.isArray(arr) && arr.some((ac: Record<string, unknown>) => (ac as any)?.email?.toLowerCase() === email);
      } catch {}
    }
    return false;
  });

  if (!matching) {
    return NextResponse.json({ error: "No matching carrier contact found for that email." }, { status: 404 });
  }

  const res = NextResponse.json({ message: "Logged in to carrier portal.", redirectTo: "/carrier-portal" });
  res.cookies.set(carrierAuthCookie, createPortalSessionToken("carrier", matching.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
