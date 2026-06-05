import { searchDatCapacity, postDatLoad } from "@/lib/integrations/dat";
import {
  searchTruckstopCapacity,
  postTruckstopLoad,
} from "@/lib/integrations/truckstop";
import type {
  MarketplaceCapacityResult,
  MarketplaceLoadRequest,
  MarketplacePostResult,
  NormalizedCapacityMatch,
} from "@/lib/marketplace/types";
import { prisma } from "@/lib/prisma";

export async function searchAndStoreMarketplaceCapacity(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }
  const db = prisma;

  const request = await buildMarketplaceLoadRequest(loadId);
  const results = await Promise.all([
    searchDatCapacity(request),
    searchTruckstopCapacity(request),
  ]);
  const matches = results.flatMap((result) => result.matches);

  await db.$transaction([
    ...results.map((result) =>
      db.integrationLog.create({
        data: capacityLogData(loadId, request, result),
      }),
    ),
    ...matches.map((match) =>
      db.carrierSourcingCandidate.create({
        data: {
          loadId,
          source: match.provider,
          status: "NEW",
          companyName: match.companyName,
          contactName: match.contactName ?? null,
          phone: match.phone ?? null,
          email: match.email ?? null,
          mcNumber: match.mcNumber ?? null,
          dotNumber: match.dotNumber ?? null,
          suggestedRate: match.suggestedRate ?? null,
          matchScore: normalizeMatchScore(match.matchScore),
          complianceSnapshot: `${match.provider} capacity result. Carrier compliance must be vetted before acceptance.`,
          notes: buildCapacityNotes(match),
        },
      }),
    ),
    ...(matches.length
      ? [
          db.shipmentEvent.create({
            data: {
              loadId,
              type: "LOCATION_UPDATE",
              message: `${matches.length} DAT/Truckstop capacity candidate${
                matches.length === 1 ? "" : "s"
              } saved.`,
              occurredAt: new Date(),
            },
          }),
        ]
      : []),
  ]);

  return {
    savedCount: matches.length,
    providerStatus: results.map(capacityStatus),
  };
}

export async function postLoadToMarketplaces(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }
  const db = prisma;

  const request = await buildMarketplaceLoadRequest(loadId);
  const results = await Promise.all([
    postDatLoad(request),
    postTruckstopLoad(request),
  ]);
  const postedCount = results.filter((result) => result.posted).length;

  await db.$transaction([
    ...results.map((result) =>
      db.integrationLog.create({
        data: postLogData(loadId, request, result),
      }),
    ),
    ...(postedCount
      ? [
          db.shipmentEvent.create({
            data: {
              loadId,
              type: "LOCATION_UPDATE",
              message: `Load posted to ${postedCount} marketplace provider${
                postedCount === 1 ? "" : "s"
              }.`,
              occurredAt: new Date(),
            },
          }),
        ]
      : []),
  ]);

  return {
    postedCount,
    providerStatus: results.map(postStatus),
  };
}

async function buildMarketplaceLoadRequest(
  loadId: string,
): Promise<MarketplaceLoadRequest> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  return {
    loadId: load.id,
    originCity: load.originCity,
    originState: load.originState,
    originAddress: load.originAddress,
    destinationCity: load.destinationCity,
    destinationState: load.destinationState,
    destinationAddress: load.destinationAddress,
    pickupDate: load.pickupDate,
    pickupWindow: load.pickupWindow,
    deliveryDate: load.deliveryDate,
    deliveryWindow: load.deliveryWindow,
    equipmentType: load.equipmentType,
    commodity: load.commodity,
    weight: load.weight,
    palletCount: load.palletCount,
    pieceCount: load.pieceCount,
    dimensions: load.dimensions,
    hazmat: load.hazmat,
    temperatureRequirement: load.temperatureRequirement,
    appointmentRequired: load.appointmentRequired,
    accessorials: load.accessorials,
    customerReference: load.customerReference,
    carrierRate: load.carrierRate === null ? null : Number(load.carrierRate),
  };
}

function capacityLogData(
  loadId: string,
  request: MarketplaceLoadRequest,
  result: MarketplaceCapacityResult,
) {
  return {
    provider: result.provider,
    action: "CAPACITY_SEARCH" as const,
    status: integrationStatus(result.configured, result.error),
    loadId,
    requestJson: toJson(request),
    responseJson: toJson(result.raw ?? result.matches),
    message: `${result.matches.length} capacity match${
      result.matches.length === 1 ? "" : "es"
    } normalized.`,
    error: result.error ?? null,
  };
}

function postLogData(
  loadId: string,
  request: MarketplaceLoadRequest,
  result: MarketplacePostResult,
) {
  return {
    provider: result.provider,
    action: "LOAD_POST" as const,
    status: integrationStatus(result.configured, result.error),
    loadId,
    requestJson: toJson(request),
    responseJson: toJson(result.raw ?? result.message ?? result.error),
    externalId: result.externalId ?? null,
    message: result.message ?? (result.posted ? "Load posted." : null),
    error: result.error ?? null,
  };
}

function capacityStatus(result: MarketplaceCapacityResult) {
  return {
    provider: result.provider,
    configured: result.configured,
    matchCount: result.matches.length,
    error: result.error ?? null,
  };
}

function postStatus(result: MarketplacePostResult) {
  return {
    provider: result.provider,
    configured: result.configured,
    posted: result.posted,
    externalId: result.externalId ?? null,
    error: result.error ?? null,
  };
}

function integrationStatus(configured: boolean, error: string | undefined) {
  if (!configured) {
    return "SKIPPED" as const;
  }

  return error ? ("FAILED" as const) : ("SUCCESS" as const);
}

function buildCapacityNotes(match: NormalizedCapacityMatch) {
  return [
    match.notes,
    `Sourced from ${match.provider}. Vet carrier compliance before accepting an offer.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeMatchScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return null;
  }

  return score > 1 ? Number((score / 100).toFixed(2)) : score;
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}
