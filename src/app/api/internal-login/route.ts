import { cookies } from "next/headers";

import {
  createInternalAuthToken,
  internalAuthCookie,
  isInternalAuthConfigured,
  verifyInternalPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (!isInternalAuthConfigured()) {
    return Response.json({
      message:
        "Internal password is not configured. Set INTERNAL_APP_PASSWORD before production.",
    });
  }

  if (typeof password !== "string" || !verifyInternalPassword(password)) {
    return Response.json({ error: "Invalid password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(internalAuthCookie, createInternalAuthToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return Response.json({ message: "Logged in." });
}
