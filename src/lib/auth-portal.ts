import { createHmac, timingSafeEqual } from "crypto";

type PortalSessionScope = "carrier" | "customer";

function getPortalSessionSecret() {
  return (
    process.env.PORTAL_SESSION_SECRET ??
    process.env.INTERNAL_APP_PASSWORD ??
    process.env.NEXTAUTH_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    "local-dev-portal-secret"
  );
}

function signPortalSession(scope: PortalSessionScope, id: string) {
  return createHmac("sha256", getPortalSessionSecret())
    .update(`${scope}:${id}`)
    .digest("base64url");
}

export function createPortalSessionToken(scope: PortalSessionScope, id: string) {
  return `${scope}.${id}.${signPortalSession(scope, id)}`;
}

export function verifyPortalSessionToken(
  scope: PortalSessionScope,
  token: string | undefined,
) {
  if (!token) {
    return null;
  }

  const [tokenScope, id, signature] = token.split(".");
  if (tokenScope !== scope || !id || !signature) {
    return null;
  }

  const expected = signPortalSession(scope, id);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  return id;
}
