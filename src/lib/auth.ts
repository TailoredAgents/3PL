export const internalAuthCookie =
  process.env.INTERNAL_AUTH_COOKIE ?? "atlanta_freight_internal";

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

function hash(value: string) {
  let hashValue = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hashValue = (hashValue * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hashValue).toString(36);
}
