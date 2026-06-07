export const internalAuthCookie =
  process.env.INTERNAL_AUTH_COOKIE ?? "dao_logistics_internal";

export const internalRoles = ["OWNER", "SALES", "OPS", "ADMIN"] as const;
export type InternalRole = (typeof internalRoles)[number];

export function isClerkAuthConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

export function isInternalAuthConfigured() {
  return Boolean(process.env.INTERNAL_APP_PASSWORD);
}

export function createInternalAuthToken() {
  const password = process.env.INTERNAL_APP_PASSWORD;

  if (!password) {
    return "";
  }

  return hash(`${password}:${process.env.NEXT_PUBLIC_APP_URL ?? "local"}`);
}

export function verifyInternalPassword(password: string) {
  return (
    Boolean(process.env.INTERNAL_APP_PASSWORD) &&
    password === process.env.INTERNAL_APP_PASSWORD
  );
}

export function parseInternalRole(value: unknown): InternalRole | null {
  return typeof value === "string" &&
    internalRoles.includes(value as InternalRole)
    ? (value as InternalRole)
    : null;
}

function hash(value: string) {
  let hashValue = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hashValue = (hashValue * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hashValue).toString(36);
}

export const carrierAuthCookie =
  process.env.CARRIER_AUTH_COOKIE ?? "dao_logistics_carrier";

export const customerAuthCookie =
  process.env.CUSTOMER_AUTH_COOKIE ?? "dao_logistics_customer";
