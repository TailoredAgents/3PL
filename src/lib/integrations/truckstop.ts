import type {
  MarketRateProviderResult,
  MarketRateRequest,
  NormalizedMarketRate,
} from "@/lib/rating/types";
import type {
  MarketplaceCapacityResult,
  MarketplaceLoadRequest,
  MarketplacePostResult,
  NormalizedCapacityMatch,
} from "@/lib/marketplace/types";
import { fetchClientCredentialsToken } from "./oauth";

const TRUCKSTOP_DEFAULT_TOKEN_URL =
  "https://identity.api.truckstop.com/connect/token";

async function getTruckstopHeaders(
  clientId: string,
  clientSecret: string,
): Promise<Record<string, string>> {
  const tokenUrl = process.env.TRUCKSTOP_TOKEN_URL ?? TRUCKSTOP_DEFAULT_TOKEN_URL;
  const token = await fetchClientCredentialsToken(tokenUrl, clientId, clientSecret);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

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
      headers: await getTruckstopHeaders(clientId, clientSecret),
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

export async function searchTruckstopCapacity(
  request: MarketplaceLoadRequest,
): Promise<MarketplaceCapacityResult> {
  const endpoint = process.env.TRUCKSTOP_CAPACITY_API_URL;
  const clientId = process.env.TRUCKSTOP_CLIENT_ID;
  const clientSecret = process.env.TRUCKSTOP_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "TRUCKSTOP",
      configured: false,
      matches: [],
      error:
        "Truckstop capacity API is not configured. Set TRUCKSTOP_CAPACITY_API_URL, TRUCKSTOP_CLIENT_ID, and TRUCKSTOP_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: await getTruckstopHeaders(clientId, clientSecret),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "TRUCKSTOP",
        configured: true,
        matches: [],
        error: `Truckstop capacity request failed with ${response.status}.`,
      };
    }

    const payload = await response.json();

    return {
      provider: "TRUCKSTOP",
      configured: true,
      matches: normalizeTruckstopCapacity(payload),
      raw: payload,
    };
  } catch (error) {
    return {
      provider: "TRUCKSTOP",
      configured: true,
      matches: [],
      error:
        error instanceof Error
          ? error.message
          : "Truckstop capacity request failed.",
    };
  }
}

export async function postTruckstopLoad(
  request: MarketplaceLoadRequest,
): Promise<MarketplacePostResult> {
  const endpoint = process.env.TRUCKSTOP_POST_LOAD_API_URL;
  const clientId = process.env.TRUCKSTOP_CLIENT_ID;
  const clientSecret = process.env.TRUCKSTOP_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "TRUCKSTOP",
      configured: false,
      posted: false,
      error:
        "Truckstop load posting API is not configured. Set TRUCKSTOP_POST_LOAD_API_URL, TRUCKSTOP_CLIENT_ID, and TRUCKSTOP_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: await getTruckstopHeaders(clientId, clientSecret),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "TRUCKSTOP",
        configured: true,
        posted: false,
        error: `Truckstop load post failed with ${response.status}.`,
      };
    }

    const payload = await response.json();
    const post = payload as {
      id?: unknown;
      externalId?: unknown;
      postId?: unknown;
      message?: unknown;
      status?: unknown;
    };

    return {
      provider: "TRUCKSTOP",
      configured: true,
      posted: true,
      externalId:
        stringValue(post.externalId) ??
        stringValue(post.postId) ??
        stringValue(post.id),
      message: stringValue(post.message) ?? stringValue(post.status),
      raw: payload,
    };
  } catch (error) {
    return {
      provider: "TRUCKSTOP",
      configured: true,
      posted: false,
      error:
        error instanceof Error ? error.message : "Truckstop load post failed.",
    };
  }
}

function normalizeTruckstopRates(payload: unknown): NormalizedMarketRate[] {
  const records = recordsFromPayload(payload);
  const rateRecords = records.length
    ? records
    : payload && typeof payload === "object"
      ? [payload as Record<string, unknown>]
      : [];

  return rateRecords.flatMap((rate) => {
    const averageRate =
      numberValue(rate.averageRate) ??
      numberValue(rate.rate) ??
      numberValue(rate.meanRate) ??
      numberValue(rate.spotRate);

    if (!averageRate) {
      return [];
    }

    return [
      {
        provider: "TRUCKSTOP" as const,
        sourceLabel:
          stringValue(rate.sourceLabel) ??
          stringValue(rate.label) ??
          "Truckstop market rate",
        lowRate: numberValue(rate.lowRate) ?? numberValue(rate.low),
        highRate: numberValue(rate.highRate) ?? numberValue(rate.high),
        averageRate,
        confidence: numberValue(rate.confidence),
        notes:
          stringValue(rate.notes) ??
          stringValue(rate.message) ??
          stringValue(rate.status),
        raw: rate,
      },
    ];
  });
}

function normalizeTruckstopCapacity(
  payload: unknown,
): NormalizedCapacityMatch[] {
  return recordsFromPayload(payload).flatMap((record) => {
    const companyName =
      stringValue(record.companyName) ??
      stringValue(record.carrierName) ??
      stringValue(record.name);

    if (!companyName) {
      return [];
    }

    return [
      {
        provider: "TRUCKSTOP" as const,
        companyName,
        contactName:
          stringValue(record.contactName) ?? stringValue(record.dispatcher),
        phone: stringValue(record.phone) ?? stringValue(record.phoneNumber),
        email: stringValue(record.email),
        mcNumber: stringValue(record.mcNumber) ?? stringValue(record.mc),
        dotNumber: stringValue(record.dotNumber) ?? stringValue(record.dot),
        suggestedRate:
          numberValue(record.suggestedRate) ??
          numberValue(record.rate) ??
          numberValue(record.askRate),
        matchScore:
          numberValue(record.matchScore) ?? numberValue(record.confidence),
        notes:
          stringValue(record.notes) ??
          stringValue(record.status) ??
          "Truckstop capacity match.",
        raw: record,
      },
    ];
  });
}

function recordsFromPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const objectPayload = payload as Record<string, unknown>;
  const records =
    objectPayload.carriers ??
    objectPayload.trucks ??
    objectPayload.rates ??
    objectPayload.matches ??
    objectPayload.results ??
    objectPayload.data;

  return Array.isArray(records)
    ? (records as Array<Record<string, unknown>>)
    : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
