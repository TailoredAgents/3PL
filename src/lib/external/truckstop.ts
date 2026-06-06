import { fetchClientCredentialsToken } from "@/lib/integrations/oauth";

const CLIENT_ID = process.env.TRUCKSTOP_CLIENT_ID;
const CLIENT_SECRET = process.env.TRUCKSTOP_CLIENT_SECRET;
const TOKEN_URL = process.env.TRUCKSTOP_TOKEN_URL ?? "https://identity.api.truckstop.com/connect/token";
const RATE_INTELLIGENCE_URL = process.env.TRUCKSTOP_RATE_INTELLIGENCE_URL;

export type TruckstopRateResult = {
  configured: boolean;
  bookedRateEstimate?: number | null;
  postedRateEstimate?: number | null;
  trendDirection?: string | null;
  raw?: unknown;
  error?: string;
};

export type TruckstopCarrierRiskResult = {
  configured: boolean;
  found: boolean;
  riskScore?: number | null;
  riskLevel?: string | null;
  rmisStatus?: string | null;
  raw?: unknown;
  error?: string;
};

export type TruckstopEldResult = {
  configured: boolean;
  found: boolean;
  lat?: number | null;
  lng?: number | null;
  lastUpdatedAt?: string | null;
  speedMph?: number | null;
  error?: string;
};

export async function getTruckstopRateIntelligence(
  originCity: string,
  originState: string,
  destinationCity: string,
  destinationState: string,
  equipmentType: string,
): Promise<TruckstopRateResult> {
  if (!CLIENT_ID || !CLIENT_SECRET || !RATE_INTELLIGENCE_URL) {
    return { configured: false };
  }

  try {
    const token = await fetchClientCredentialsToken(CLIENT_ID, CLIENT_SECRET, TOKEN_URL);

    const res = await fetch(RATE_INTELLIGENCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originCity,
        originState,
        destinationCity,
        destinationState,
        equipmentType,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Truckstop Rate Intelligence ${res.status}`);

    const json = (await res.json()) as Record<string, unknown>;

    return {
      configured: true,
      bookedRateEstimate: json.bookedRateEstimate as number | null,
      postedRateEstimate: json.postedRateEstimate as number | null,
      trendDirection: json.trendDirection as string | null,
      raw: json,
    };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Truckstop rate fetch failed",
    };
  }
}

export async function getTruckstopCarrierRisk(
  mcNumber: string,
): Promise<TruckstopCarrierRiskResult> {
  if (!CLIENT_ID || !CLIENT_SECRET) return { configured: false, found: false };

  const clean = mcNumber.replace(/^MC-?/i, "").replace(/\D/g, "").trim();
  if (!clean) return { configured: true, found: false, error: "Invalid MC number" };

  try {
    const token = await fetchClientCredentialsToken(CLIENT_ID, CLIENT_SECRET, TOKEN_URL);

    const res = await fetch(
      `https://api.integration.truckstop.com/v1/carrier/${clean}/risk`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (res.status === 404) return { configured: true, found: false };
    if (!res.ok) throw new Error(`Truckstop Carrier Risk ${res.status}`);

    const json = (await res.json()) as Record<string, unknown>;

    return {
      configured: true,
      found: true,
      riskScore: json.riskScore as number | null,
      riskLevel: json.riskLevel as string | null,
      rmisStatus: json.rmisStatus as string | null,
      raw: json,
    };
  } catch (err) {
    return {
      configured: true,
      found: false,
      error: err instanceof Error ? err.message : "Truckstop carrier risk fetch failed",
    };
  }
}

export async function getTruckstopEldPosition(
  mcNumber: string,
): Promise<TruckstopEldResult> {
  if (!CLIENT_ID || !CLIENT_SECRET) return { configured: false, found: false };

  const clean = mcNumber.replace(/^MC-?/i, "").replace(/\D/g, "").trim();
  if (!clean) return { configured: true, found: false, error: "Invalid MC number" };

  try {
    const token = await fetchClientCredentialsToken(CLIENT_ID, CLIENT_SECRET, TOKEN_URL);

    const res = await fetch(
      `https://api.integration.truckstop.com/v1/carrier/${clean}/location`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (res.status === 404) return { configured: true, found: false };
    if (!res.ok) throw new Error(`Truckstop ELD ${res.status}`);

    const json = (await res.json()) as Record<string, unknown>;

    return {
      configured: true,
      found: true,
      lat: json.latitude as number | null,
      lng: json.longitude as number | null,
      lastUpdatedAt: json.lastUpdatedAt as string | null,
      speedMph: json.speedMph as number | null,
    };
  } catch (err) {
    return {
      configured: true,
      found: false,
      error: err instanceof Error ? err.message : "Truckstop ELD fetch failed",
    };
  }
}
