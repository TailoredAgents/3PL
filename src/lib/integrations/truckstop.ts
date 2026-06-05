import type {
  MarketRateProviderResult,
  MarketRateRequest,
  NormalizedMarketRate,
} from "@/lib/rating/types";

export async function fetchTruckstopRates(
  request: MarketRateRequest,
): Promise<MarketRateProviderResult> {
  const endpoint = process.env.TRUCKSTOP_RATE_API_URL;
  const clientId = process.env.TRUCKSTOP_CLIENT_ID;
  const clientSecret = process.env.TRUCKSTOP_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "TRUCKSTOP",
      configured: false,
      rates: [],
      error:
        "Truckstop rate API is not configured. Set TRUCKSTOP_RATE_API_URL, TRUCKSTOP_CLIENT_ID, and TRUCKSTOP_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TRUCKSTOP-CLIENT-ID": clientId,
        "X-TRUCKSTOP-CLIENT-SECRET": clientSecret,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "TRUCKSTOP",
        configured: true,
        rates: [],
        error: `Truckstop rate request failed with ${response.status}.`,
      };
    }

    const payload = await response.json();

    return {
      provider: "TRUCKSTOP",
      configured: true,
      rates: normalizeTruckstopRates(payload),
    };
  } catch (error) {
    return {
      provider: "TRUCKSTOP",
      configured: true,
      rates: [],
      error:
        error instanceof Error
          ? error.message
          : "Truckstop rate request failed.",
    };
  }
}

function normalizeTruckstopRates(payload: unknown): NormalizedMarketRate[] {
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
      provider: "TRUCKSTOP",
      sourceLabel: "Truckstop market rate",
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
