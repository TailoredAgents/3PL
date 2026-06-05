import type {
  MarketRateProviderResult,
  MarketRateRequest,
  NormalizedMarketRate,
} from "@/lib/rating/types";

export async function fetchDatRates(
  request: MarketRateRequest,
): Promise<MarketRateProviderResult> {
  const endpoint = process.env.DAT_RATE_API_URL;
  const clientId = process.env.DAT_CLIENT_ID;
  const clientSecret = process.env.DAT_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "DAT",
      configured: false,
      rates: [],
      error:
        "DAT rate API is not configured. Set DAT_RATE_API_URL, DAT_CLIENT_ID, and DAT_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DAT-CLIENT-ID": clientId,
        "X-DAT-CLIENT-SECRET": clientSecret,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "DAT",
        configured: true,
        rates: [],
        error: `DAT rate request failed with ${response.status}.`,
      };
    }

    const payload = await response.json();

    return {
      provider: "DAT",
      configured: true,
      rates: normalizeDatRates(payload),
    };
  } catch (error) {
    return {
      provider: "DAT",
      configured: true,
      rates: [],
      error:
        error instanceof Error ? error.message : "DAT rate request failed.",
    };
  }
}

function normalizeDatRates(payload: unknown): NormalizedMarketRate[] {
  const rate = payload as {
    lowRate?: unknown;
    highRate?: unknown;
    averageRate?: unknown;
    rate?: unknown;
    confidence?: unknown;
    notes?: unknown;
  };
  const averageRate = numberValue(rate.averageRate) ?? numberValue(rate.rate);

  if (!averageRate) {
    return [];
  }

  return [
    {
      provider: "DAT",
      sourceLabel: "DAT market rate",
      lowRate: numberValue(rate.lowRate),
      highRate: numberValue(rate.highRate),
      averageRate,
      confidence: numberValue(rate.confidence),
      notes: typeof rate.notes === "string" ? rate.notes : null,
      raw: payload,
    },
  ];
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
