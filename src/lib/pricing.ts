import { prisma } from "@/lib/prisma";

export type PricingBasis = {
  quoteRequestId: string;
  lane: string;
  targetMarginPercent: number;
  benchmarkAverage: number | null;
  internalBuyAverage: number | null;
  internalSellAverage: number | null;
  latestCustomerQuote: number | null;
  recommendedCarrierCost: number;
  recommendedCustomerRate: number;
  projectedGrossProfit: number;
  marginPercent: number;
  riskLevel: string;
  validForHours: number;
  summary: string;
};

export async function buildPricingBasis(
  quoteRequestId: string,
): Promise<PricingBasis | null> {
  if (!prisma) {
    return null;
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    include: {
      rateBenchmarks: {
        orderBy: { createdAt: "desc" },
      },
      customerQuotes: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      shipper: true,
    },
  });

  if (!quote) {
    return null;
  }

  const laneLoads = await prisma.load.findMany({
    where: {
      originCity: { equals: quote.originCity, mode: "insensitive" },
      originState: quote.originState,
      destinationCity: { equals: quote.destinationCity, mode: "insensitive" },
      destinationState: quote.destinationState,
      equipmentType: { equals: quote.equipmentType, mode: "insensitive" },
      carrierRate: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const marketBenchmarkAverage = average(
    quote.rateBenchmarks
      .filter((benchmark) => ["DAT", "TRUCKSTOP"].includes(benchmark.source))
      .map((benchmark) => Number(benchmark.averageRate)),
  );
  const fallbackBenchmarkAverage = average(
    quote.rateBenchmarks
      .filter((benchmark) => !["DAT", "TRUCKSTOP"].includes(benchmark.source))
      .map((benchmark) => Number(benchmark.averageRate)),
  );
  const internalBuyAverage = average(
    laneLoads.map((load) =>
      load.carrierRate === null ? null : Number(load.carrierRate),
    ),
  );
  const internalSellAverage = average(
    laneLoads.map((load) => Number(load.customerRate)),
  );
  const latestCustomerQuote =
    quote.customerQuotes[0]?.quotedRate === undefined
      ? null
      : Number(quote.customerQuotes[0].quotedRate);
  const targetMarginPercent = quote.targetMarginPercent
    ? Number(quote.targetMarginPercent)
    : 18;
  const buyRate =
    marketBenchmarkAverage ??
    fallbackBenchmarkAverage ??
    internalBuyAverage ??
    (latestCustomerQuote ? Math.round(latestCustomerQuote * 0.82) : null);

  if (!buyRate) {
    return null;
  }

  const recommendedCarrierCost = Math.round(buyRate);
  const recommendedCustomerRate = Math.ceil(
    recommendedCarrierCost / (1 - targetMarginPercent / 100),
  );
  const projectedGrossProfit =
    recommendedCustomerRate - recommendedCarrierCost;
  const marginPercent = Number(
    ((projectedGrossProfit / recommendedCustomerRate) * 100).toFixed(2),
  );
  const riskLevel = getRiskLevel({
    benchmarkCount: quote.rateBenchmarks.length,
    laneHistoryCount: laneLoads.length,
    hazmat: quote.hazmat,
    appointmentRequired: quote.appointmentRequired,
    urgency: quote.urgency,
  });
  const validForHours = riskLevel === "High" ? 4 : riskLevel === "Medium" ? 12 : 24;
  const lane = `${quote.originCity}, ${quote.originState} -> ${quote.destinationCity}, ${quote.destinationState}`;

  return {
    quoteRequestId,
    lane,
    targetMarginPercent,
    benchmarkAverage: marketBenchmarkAverage ?? fallbackBenchmarkAverage,
    internalBuyAverage,
    internalSellAverage,
    latestCustomerQuote,
    recommendedCarrierCost,
    recommendedCustomerRate,
    projectedGrossProfit,
    marginPercent,
    riskLevel,
    validForHours,
    summary: [
      `Recommended ${formatCurrency(recommendedCustomerRate)} sell rate on ${formatCurrency(recommendedCarrierCost)} target buy.`,
      `Target margin ${targetMarginPercent}%, projected margin ${formatCurrency(projectedGrossProfit)} (${marginPercent}%).`,
      marketBenchmarkAverage
        ? "Primary basis: DAT/Truckstop market benchmark."
        : "Primary basis: fallback benchmark/internal history because live market rates are unavailable.",
      `Risk level ${riskLevel.toLowerCase()} based on benchmark count, lane history, urgency, hazmat, and appointments.`,
    ].join(" "),
  };
}

export async function createSystemPricingRecommendation(quoteRequestId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const basis = await buildPricingBasis(quoteRequestId);

  if (!basis) {
    throw new Error(
      "Add DAT/Truckstop market rates, a manual benchmark, internal lane history, or an existing customer quote before generating pricing.",
    );
  }

  return prisma.pricingRecommendation.create({
    data: {
      quoteRequestId,
      source: "SYSTEM",
      recommendedCarrierCost: basis.recommendedCarrierCost,
      recommendedCustomerRate: basis.recommendedCustomerRate,
      projectedGrossProfit: basis.projectedGrossProfit,
      marginPercent: basis.marginPercent,
      targetMarginPercent: basis.targetMarginPercent,
      riskLevel: basis.riskLevel,
      validForHours: basis.validForHours,
      summary: basis.summary,
      notes: JSON.stringify({
        benchmarkAverage: basis.benchmarkAverage,
        internalBuyAverage: basis.internalBuyAverage,
        internalSellAverage: basis.internalSellAverage,
        latestCustomerQuote: basis.latestCustomerQuote,
      }),
    },
  });
}

function average(values: Array<number | null>) {
  const numbers = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (!numbers.length) {
    return null;
  }

  return Math.round(
    numbers.reduce((total, value) => total + value, 0) / numbers.length,
  );
}

function getRiskLevel(input: {
  benchmarkCount: number;
  laneHistoryCount: number;
  hazmat: boolean;
  appointmentRequired: boolean;
  urgency?: string | null;
}) {
  const urgent = input.urgency?.toLowerCase().includes("same") ?? false;
  const riskScore =
    (input.benchmarkCount === 0 ? 2 : 0) +
    (input.laneHistoryCount === 0 ? 1 : 0) +
    (input.hazmat ? 1 : 0) +
    (input.appointmentRequired ? 1 : 0) +
    (urgent ? 1 : 0);

  if (riskScore >= 3) {
    return "High";
  }

  if (riskScore >= 1) {
    return "Medium";
  }

  return "Low";
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}
