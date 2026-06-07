import { fetchDatRates } from "@/lib/integrations/dat";
import { fetchTruckstopRates } from "@/lib/integrations/truckstop";
import { prisma } from "@/lib/prisma";
import type {
  MarketRateProviderResult,
  MarketRateRequest,
  NormalizedMarketRate,
} from "@/lib/rating/types";

const providerRequirements = [
  {
    provider: "DAT" as const,
    label: "DAT",
    requiredEnv: ["DAT_RATE_API_URL", "DAT_CLIENT_ID", "DAT_CLIENT_SECRET"],
  },
  {
    provider: "TRUCKSTOP" as const,
    label: "Truckstop",
    requiredEnv: [
      "TRUCKSTOP_RATE_API_URL",
      "TRUCKSTOP_CLIENT_ID",
      "TRUCKSTOP_CLIENT_SECRET",
    ],
  },
] as const;

export async function fetchAndStoreMarketRates(quoteRequestId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequestId },
  });

  if (!quote) {
    throw new Error("Quote request not found.");
  }

  const request: MarketRateRequest = {
    originCity: quote.originCity,
    originState: quote.originState,
    destinationCity: quote.destinationCity,
    destinationState: quote.destinationState,
    pickupDate: quote.pickupDate,
    equipmentType: quote.equipmentType,
    weight: quote.weight,
  };

  const providerResults = await Promise.all([
    fetchDatRates(request),
    fetchTruckstopRates(request),
  ]);
  const rates = providerResults.flatMap((result) => result.rates);

  if (rates.length) {
    await prisma.rateBenchmark.createMany({
      data: rates.map((rate) => ({
        quoteRequestId,
        source: rate.provider,
        sourceLabel: rate.sourceLabel,
        lowRate: rate.lowRate ?? null,
        highRate: rate.highRate ?? null,
        averageRate: rate.averageRate,
        confidence: rate.confidence ?? null,
        notes: buildRateNote(rate, request),
      })),
    });
  }

  return {
    providerResults,
    savedCount: rates.length,
    rates,
  };
}

export function getProviderStatusSummary(results: MarketRateProviderResult[]) {
  return results.map((result) => ({
    provider: result.provider,
    configured: result.configured,
    rateCount: result.rates.length,
    error: result.error ?? null,
    missingEnv:
      getMarketRateProviderReadiness().find(
        (provider) => provider.provider === result.provider,
      )?.missingEnv ?? [],
  }));
}

export function getMarketRateProviderReadiness() {
  return providerRequirements.map((provider) => {
    const missingEnv = provider.requiredEnv.filter((key) => !process.env[key]);

    return {
      provider: provider.provider,
      label: provider.label,
      configured: missingEnv.length === 0,
      requiredEnv: [...provider.requiredEnv],
      missingEnv,
      message: missingEnv.length
        ? `${provider.label} rate fetch is not configured. Missing ${missingEnv.join(", ")}.`
        : `${provider.label} rate fetch appears configured.`,
    };
  });
}

export function formatProviderStatusForMessage(
  results: MarketRateProviderResult[],
) {
  return getProviderStatusSummary(results)
    .map((provider) => {
      const status = provider.configured
        ? provider.rateCount
          ? `${provider.rateCount} rate${provider.rateCount === 1 ? "" : "s"}`
          : provider.error ?? "configured but returned no rates"
        : `missing ${provider.missingEnv.join(", ") || "credentials"}`;

      return `${provider.provider}: ${status}`;
    })
    .join(" | ");
}

function buildRateNote(rate: NormalizedMarketRate, request: MarketRateRequest) {
  return [
    `Provider: ${rate.provider}`,
    `Lane: ${request.originCity}, ${request.originState} -> ${request.destinationCity}, ${request.destinationState}`,
    `Equipment: ${request.equipmentType}`,
    request.pickupDate
      ? `Pickup: ${request.pickupDate.toISOString().slice(0, 10)}`
      : null,
    request.weight ? `Weight: ${request.weight}` : null,
    `Average: $${rate.averageRate.toLocaleString()}`,
    rate.lowRate ? `Low: $${rate.lowRate.toLocaleString()}` : null,
    rate.highRate ? `High: $${rate.highRate.toLocaleString()}` : null,
    rate.confidence === null || rate.confidence === undefined
      ? null
      : `Confidence: ${Math.round(rate.confidence * 100)}%`,
    rate.notes ? `Provider notes: ${rate.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
