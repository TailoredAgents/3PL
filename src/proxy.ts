import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/leads",
  "/shippers",
  "/quote-requests",
  "/intake",
  "/api/leads",
  "/api/shippers",
  "/api/quote-requests",
  "/api/contact-import",
];

export function proxy(request: NextRequest) {
  if (!process.env.INTERNAL_APP_PASSWORD) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieName = process.env.INTERNAL_AUTH_COOKIE ?? "atlanta_freight_internal";
  const token = request.cookies.get(cookieName)?.value;
  const expected = hash(
    `${process.env.INTERNAL_APP_PASSWORD}:${
      process.env.NEXT_PUBLIC_APP_URL ?? "local"
    }`,
  );

  if (token === expected) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Internal access required." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/internal-login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/shippers/:path*",
    "/quote-requests/:path*",
    "/intake/:path*",
    "/api/leads/:path*",
    "/api/shippers/:path*",
    "/api/quote-requests/:path*",
    "/api/contact-import/:path*",
  ],
};

function hash(value: string) {
  // Small non-cryptographic hash for proxy compatibility. Clerk replaces this later.
  let hashValue = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hashValue = (hashValue * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hashValue).toString(36);
}
