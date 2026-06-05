import { fetchDatRates } from "@/lib/integrations/dat";
import { fetchTruckstopRates } from "@/lib/integrations/truckstop";
import { prisma } from "@/lib/prisma";
import type {
  MarketRateProviderResult,
  MarketRateRequest,
  NormalizedMarketRate,
} from "@/lib/rating/types";

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
        notes: buildRateNote(rate),
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
  }));
}

function buildRateNote(rate: NormalizedMarketRate) {
  return rate.notes ?? null;
}
