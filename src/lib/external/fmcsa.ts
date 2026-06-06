const FMCSA_WEB_KEY = process.env.FMCSA_WEB_KEY;
const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services/carriers";

export type FmcsaCarrierResult = {
  configured: boolean;
  found: boolean;
  dotNumber?: string;
  mcNumber?: string;
  legalName?: string;
  dbaName?: string;
  phone?: string;
  authorityStatus?: string;
  outOfService?: boolean;
  outOfServiceDate?: string;
  safetyRating?: string;
  totalDriverInspections?: number;
  totalVehicleInspections?: number;
  driverOosPercent?: number;
  vehicleOosPercent?: number;
  totalCrashes?: number;
  basicScores?: Record<string, number | null>;
  multipleMatches?: boolean;
  raw?: unknown;
  error?: string;
};

export async function lookupCarrierByDot(dotNumber: string): Promise<FmcsaCarrierResult> {
  if (!FMCSA_WEB_KEY) return { configured: false, found: false };
  const clean = sanitizeDotNumber(dotNumber);
  if (!clean) return { configured: true, found: false, error: "Invalid DOT number" };

  try {
    const url = `${FMCSA_BASE}/${clean}?webKey=${FMCSA_WEB_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.status === 404) return { configured: true, found: false };
    if (!res.ok) throw new Error(`FMCSA API ${res.status}`);
    const json = (await res.json()) as { content?: unknown[] };
    return parseCarrierResponse(json, clean, undefined);
  } catch (err) {
    return {
      configured: true,
      found: false,
      error: err instanceof Error ? err.message : "FMCSA fetch failed",
    };
  }
}

export async function lookupCarrierByMc(mcNumber: string): Promise<FmcsaCarrierResult> {
  if (!FMCSA_WEB_KEY) return { configured: false, found: false };
  const clean = sanitizeMcNumber(mcNumber);
  if (!clean) return { configured: true, found: false, error: "Invalid MC number" };

  try {
    const url = `${FMCSA_BASE}/docket-number/${clean}?webKey=${FMCSA_WEB_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.status === 404) return { configured: true, found: false };
    if (!res.ok) throw new Error(`FMCSA API ${res.status}`);
    const json = (await res.json()) as { content?: unknown[] };
    return parseCarrierResponse(json, undefined, clean);
  } catch (err) {
    return {
      configured: true,
      found: false,
      error: err instanceof Error ? err.message : "FMCSA fetch failed",
    };
  }
}

function sanitizeDotNumber(value: string): string {
  return value.replace(/\D/g, "").trim();
}

function sanitizeMcNumber(value: string): string {
  return value.replace(/^MC-?/i, "").replace(/\D/g, "").trim();
}

function parseCarrierResponse(
  json: { content?: unknown[] },
  dotNumber: string | undefined,
  mcNumber: string | undefined,
): FmcsaCarrierResult {
  const content = json?.content;
  if (!content || content.length === 0) return { configured: true, found: false };

  const carrier = content[0] as Record<string, unknown>;
  const multipleMatches = content.length > 1;

  const basics = carrier.basics as Record<string, Record<string, unknown>> | undefined;
  const basicScores: Record<string, number | null> = {};
  if (basics) {
    for (const [key, val] of Object.entries(basics)) {
      const score = val?.percentile;
      basicScores[key] = typeof score === "number" ? score : null;
    }
  }

  return {
    configured: true,
    found: true,
    dotNumber: String(carrier.dotNumber ?? dotNumber ?? ""),
    mcNumber: String(carrier.mcNumber ?? mcNumber ?? ""),
    legalName: carrier.legalName as string | undefined,
    dbaName: carrier.dbaName as string | undefined,
    phone: carrier.telephone as string | undefined,
    authorityStatus: carrier.allowedToOperate as string | undefined,
    outOfService: carrier.outOfService === "Y",
    outOfServiceDate: carrier.outOfServiceDate as string | undefined,
    safetyRating: carrier.safetyRating as string | undefined,
    totalDriverInspections: carrier.totalDriverInspections as number | undefined,
    totalVehicleInspections: carrier.totalVehicleInspections as number | undefined,
    driverOosPercent: carrier.driverOosInspPercent as number | undefined,
    vehicleOosPercent: carrier.vehicleOosInspPercent as number | undefined,
    totalCrashes: carrier.totalCrashes as number | undefined,
    basicScores,
    multipleMatches,
    raw: carrier,
  };
}
