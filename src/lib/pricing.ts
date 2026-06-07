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
  appliedMarginRule: string | null;
  appliedQuoteTemplate: string | null;
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

  const { marginRule, quoteTemplate } = await findLanePricingControls(quote);
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
  const templateCarrierCost =
    quoteTemplate?.targetCarrierCost === null ||
    quoteTemplate?.targetCarrierCost === undefined
      ? null
      : Number(quoteTemplate.targetCarrierCost);
  const templateCustomerRate =
    quoteTemplate?.customerRate === null ||
    quoteTemplate?.customerRate === undefined
      ? null
      : Number(quoteTemplate.customerRate);
  const templateTargetMargin =
    quoteTemplate?.targetMarginPercent === null ||
    quoteTemplate?.targetMarginPercent === undefined
      ? null
      : Number(quoteTemplate.targetMarginPercent);
  const targetMarginPercent = quote.targetMarginPercent
    ? Number(quote.targetMarginPercent)
    : marginRule
      ? Number(marginRule.targetMarginPercent)
      : templateTargetMargin ?? 18;
  const buyRate =
    marketBenchmarkAverage ??
    fallbackBenchmarkAverage ??
    internalBuyAverage ??
    templateCarrierCost ??
    (templateCustomerRate
      ? Math.round(templateCustomerRate * (1 - targetMarginPercent / 100))
      : null) ??
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
    appliedMarginRule: marginRule?.name ?? null,
    appliedQuoteTemplate: quoteTemplate?.name ?? null,
    summary: [
      `Recommended ${formatCurrency(recommendedCustomerRate)} sell rate on ${formatCurrency(recommendedCarrierCost)} target buy.`,
      `Target margin ${targetMarginPercent}%, projected margin ${formatCurrency(projectedGrossProfit)} (${marginPercent}%).`,
      marginRule ? `Applied margin rule: ${marginRule.name}.` : null,
      quoteTemplate ? `Matched saved quote template: ${quoteTemplate.name}.` : null,
      marketBenchmarkAverage
        ? "Primary basis: DAT/Truckstop market benchmark."
        : "Primary basis: fallback benchmark/internal history because live market rates are unavailable.",
      `Risk level ${riskLevel.toLowerCase()} based on benchmark count, lane history, urgency, hazmat, and appointments.`,
    ].filter(Boolean).join(" "),
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
        appliedMarginRule: basis.appliedMarginRule,
        appliedQuoteTemplate: basis.appliedQuoteTemplate,
      }),
    },
  });
}

async function findLanePricingControls(quote: {
  shipperId: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  urgency?: string | null;
}) {
  const db = prisma;
  if (!db) {
    return { marginRule: null, quoteTemplate: null };
  }

  const [rules, templates] = await Promise.all([
    db.laneMarginRule.findMany({
      where: {
        active: true,
        OR: [{ shipperId: null }, { shipperId: quote.shipperId }],
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    db.laneQuoteTemplate.findMany({
      where: {
        active: true,
        originCity: { equals: quote.originCity, mode: "insensitive" },
        originState: quote.originState,
        destinationCity: { equals: quote.destinationCity, mode: "insensitive" },
        destinationState: quote.destinationState,
        equipmentType: { equals: quote.equipmentType, mode: "insensitive" },
        OR: [{ shipperId: null }, { shipperId: quote.shipperId }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const marginRule = rules
    .map((rule) => ({ rule, score: scoreMarginRule(rule, quote) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.rule.priority - b.rule.priority)[0]?.rule ?? null;
  const quoteTemplate =
    templates
      .sort((a, b) => getTemplateScore(b, quote) - getTemplateScore(a, quote))[0] ??
    null;

  return { marginRule, quoteTemplate };
}

function scoreMarginRule(
  rule: {
    shipperId: string | null;
    originCity: string | null;
    originState: string | null;
    destinationCity: string | null;
    destinationState: string | null;
    equipmentType: string | null;
    urgency: string | null;
  },
  quote: {
    shipperId: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    equipmentType: string;
    urgency?: string | null;
  },
) {
  let score = 0;

  if (!nullableMatch(rule.shipperId, quote.shipperId, true)) return -1;
  if (!nullableMatch(rule.originCity, quote.originCity)) return -1;
  if (!nullableMatch(rule.originState, quote.originState, true)) return -1;
  if (!nullableMatch(rule.destinationCity, quote.destinationCity)) return -1;
  if (!nullableMatch(rule.destinationState, quote.destinationState, true)) return -1;
  if (!nullableMatch(rule.equipmentType, quote.equipmentType)) return -1;
  if (!nullableMatch(rule.urgency, quote.urgency ?? "")) return -1;

  if (rule.shipperId) score += 20;
  if (rule.originCity && rule.originState && rule.destinationCity && rule.destinationState) {
    score += 20;
  }
  if (rule.equipmentType) score += 10;
  if (rule.urgency) score += 6;

  return score;
}

function getTemplateScore(
  template: { shipperId: string | null },
  quote: { shipperId: string },
) {
  return template.shipperId === quote.shipperId ? 10 : 0;
}

function nullableMatch(ruleValue: string | null, quoteValue: string, exact = false) {
  if (!ruleValue) {
    return true;
  }

  if (exact) {
    return ruleValue === quoteValue;
  }

  return ruleValue.toLowerCase() === quoteValue.toLowerCase();
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
