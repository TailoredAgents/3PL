import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/leads",
  "/email",
  "/shippers",
  "/quote-requests",
  "/carriers",
  "/loads",
  "/agents",
  "/intake",
  "/communications",
  "/contacts",
  "/documents",
  "/billing",
  "/payables",
  "/analytics",
  "/tracking",
  "/integrations",
  "/settings",
  "/calls",
  "/api/agents",
  "/api/calls",
  "/api/leads",
  "/api/shippers",
  "/api/quote-requests",
  "/api/contact-import",
  "/api/carriers",
  "/api/loads",
  "/api/contacts",
  "/api/carrier-invoices",
  "/api/integrations",
  "/api/settings",
];
const protectedRoutePatterns = protectedPrefixes.map(
  (prefix) => `${prefix}(.*)`,
);
const isProtectedRoute = createRouteMatcher(protectedRoutePatterns);
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

function passwordProxy(request: NextRequest) {
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

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const proxy = clerkConfigured ? clerkProxy : passwordProxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/email/:path*",
    "/shippers/:path*",
    "/quote-requests/:path*",
    "/carriers/:path*",
    "/loads/:path*",
    "/agents/:path*",
    "/intake/:path*",
    "/communications/:path*",
    "/contacts/:path*",
    "/documents/:path*",
    "/billing/:path*",
    "/payables/:path*",
    "/analytics/:path*",
    "/tracking/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/calls/:path*",
    "/api/agents/:path*",
    "/api/calls/:path*",
    "/api/leads/:path*",
    "/api/shippers/:path*",
    "/api/quote-requests/:path*",
    "/api/contact-import/:path*",
    "/api/carriers/:path*",
    "/api/loads/:path*",
    "/api/contacts/:path*",
    "/api/carrier-invoices/:path*",
    "/api/integrations/:path*",
    "/api/settings/:path*",
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
