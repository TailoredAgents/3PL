const CARRIEROK_API_KEY = process.env.CARRIEROK_API_KEY;
const CARRIEROK_BASE = "https://api.carrier-ok.com/v1";

export type CarrierOkResult = {
  configured: boolean;
  found: boolean;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  authorityAge?: number | null;
  totalInspections24Mo?: number | null;
  driverOosPercent?: number | null;
  vehicleOosPercent?: number | null;
  crashRate?: number | null;
  fraudSignals: FraudSignals;
  raw?: unknown;
  error?: string;
};

export type FraudSignals = {
  newAuthority: boolean;
  veryNewAuthority: boolean;
  zeroInspections: boolean;
  phoneMismatch: boolean | null;
  nameMismatch: boolean | null;
  highRiskEmailDomain: boolean | null;
  flags: string[];
};

export async function getCarrierRiskProfile(
  mcNumber: string | null | undefined,
  dotNumber: string | null | undefined,
  options?: {
    providedPhone?: string | null;
    providedName?: string | null;
    providedEmail?: string | null;
  },
): Promise<CarrierOkResult> {
  const identifier = dotNumber
    ? dotNumber.replace(/\D/g, "").trim()
    : mcNumber
      ? mcNumber.replace(/^MC-?/i, "").replace(/\D/g, "").trim()
      : null;

  if (!identifier) {
    return {
      configured: Boolean(CARRIEROK_API_KEY),
      found: false,
      fraudSignals: buildFraudSignals(null, options),
      error: "No DOT or MC number provided",
    };
  }

  if (!CARRIEROK_API_KEY) {
    return {
      configured: false,
      found: false,
      fraudSignals: buildFraudSignals(null, options),
    };
  }

  try {
    const param = dotNumber ? `dot/${identifier}` : `mc/${identifier}`;
    const res = await fetch(`${CARRIEROK_BASE}/carrier/${param}`, {
      headers: {
        Authorization: `Bearer ${CARRIEROK_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      return {
        configured: true,
        found: false,
        fraudSignals: buildFraudSignals(null, options),
      };
    }
    if (!res.ok) throw new Error(`CarrierOk API ${res.status}`);

    const json = (await res.json()) as Record<string, unknown>;

    const fraudSignals = buildFraudSignals(json, options);

    return {
      configured: true,
      found: true,
      riskScore: json.riskScore as number | null,
      riskLevel: json.riskLevel as CarrierOkResult["riskLevel"],
      authorityAge: json.authorityAgeDays as number | null,
      totalInspections24Mo: json.totalInspections24Mo as number | null,
      driverOosPercent: json.driverOosPercent as number | null,
      vehicleOosPercent: json.vehicleOosPercent as number | null,
      crashRate: json.crashRate as number | null,
      fraudSignals,
      raw: json,
    };
  } catch (err) {
    return {
      configured: true,
      found: false,
      fraudSignals: buildFraudSignals(null, options),
      error: err instanceof Error ? err.message : "CarrierOk fetch failed",
    };
  }
}

const HIGH_RISK_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];

function buildFraudSignals(
  data: Record<string, unknown> | null,
  options?: { providedPhone?: string | null; providedName?: string | null; providedEmail?: string | null },
): FraudSignals {
  const authorityAge = data?.authorityAgeDays as number | null;
  const totalInspections = data?.totalInspections24Mo as number | null;
  const fmcsaPhone = data?.phone as string | null;
  const legalName = data?.legalName as string | null;

  const newAuthority = authorityAge !== null && authorityAge !== undefined ? authorityAge < 365 : false;
  const veryNewAuthority = authorityAge !== null && authorityAge !== undefined ? authorityAge < 180 : false;
  const zeroInspections = totalInspections !== null && totalInspections !== undefined ? totalInspections === 0 : false;

  const phoneMismatch =
    options?.providedPhone && fmcsaPhone
      ? normalizePhone(options.providedPhone) !== normalizePhone(fmcsaPhone)
      : null;

  const nameMismatch =
    options?.providedName && legalName
      ? !legalName.toLowerCase().includes(options.providedName.toLowerCase().split(" ")[0])
      : null;

  const emailDomain = options?.providedEmail?.split("@")[1]?.toLowerCase();
  const highRiskEmailDomain = emailDomain ? HIGH_RISK_EMAIL_DOMAINS.includes(emailDomain) : null;

  const flags: string[] = [];
  if (veryNewAuthority) flags.push("Authority granted <6 months ago — high theft risk");
  else if (newAuthority) flags.push("Authority granted <12 months ago — verify carefully");
  if (zeroInspections) flags.push("Zero inspections in 24 months — possible shell company");
  if (phoneMismatch) flags.push("Phone number does not match FMCSA record — identity risk");
  if (nameMismatch) flags.push("Company name does not match FMCSA legal name — verify");
  if (highRiskEmailDomain) flags.push(`Free email domain (${emailDomain}) — use company email`);

  return { newAuthority, veryNewAuthority, zeroInspections, phoneMismatch, nameMismatch, highRiskEmailDomain, flags };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}
