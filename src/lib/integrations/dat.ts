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

const DAT_DEFAULT_TOKEN_URL =
  "https://identity.api.dat.com/access/v1/token/organization";

async function getDatHeaders(
  clientId: string,
  clientSecret: string,
): Promise<Record<string, string>> {
  const tokenUrl = process.env.DAT_TOKEN_URL ?? DAT_DEFAULT_TOKEN_URL;
  const token = await fetchClientCredentialsToken(tokenUrl, clientId, clientSecret);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

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
      headers: await getDatHeaders(clientId, clientSecret),
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

export async function searchDatCapacity(
  request: MarketplaceLoadRequest,
): Promise<MarketplaceCapacityResult> {
  const endpoint = process.env.DAT_CAPACITY_API_URL;
  const clientId = process.env.DAT_CLIENT_ID;
  const clientSecret = process.env.DAT_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "DAT",
      configured: false,
      matches: [],
      error:
        "DAT capacity API is not configured. Set DAT_CAPACITY_API_URL, DAT_CLIENT_ID, and DAT_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: await getDatHeaders(clientId, clientSecret),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "DAT",
        configured: true,
        matches: [],
        error: `DAT capacity request failed with ${response.status}.`,
      };
    }

    const payload = await response.json();

    return {
      provider: "DAT",
      configured: true,
      matches: normalizeDatCapacity(payload),
      raw: payload,
    };
  } catch (error) {
    return {
      provider: "DAT",
      configured: true,
      matches: [],
      error:
        error instanceof Error ? error.message : "DAT capacity request failed.",
    };
  }
}

export async function postDatLoad(
  request: MarketplaceLoadRequest,
): Promise<MarketplacePostResult> {
  const endpoint = process.env.DAT_POST_LOAD_API_URL;
  const clientId = process.env.DAT_CLIENT_ID;
  const clientSecret = process.env.DAT_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    return {
      provider: "DAT",
      configured: false,
      posted: false,
      error:
        "DAT load posting API is not configured. Set DAT_POST_LOAD_API_URL, DAT_CLIENT_ID, and DAT_CLIENT_SECRET.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: await getDatHeaders(clientId, clientSecret),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        provider: "DAT",
        configured: true,
        posted: false,
        error: `DAT load post failed with ${response.status}.`,
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
      provider: "DAT",
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
      provider: "DAT",
      configured: true,
      posted: false,
      error: error instanceof Error ? error.message : "DAT load post failed.",
    };
  }
}

function normalizeDatRates(payload: unknown): NormalizedMarketRate[] {
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
        provider: "DAT" as const,
        sourceLabel:
          stringValue(rate.sourceLabel) ??
          stringValue(rate.label) ??
          "DAT market rate",
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

function normalizeDatCapacity(payload: unknown): NormalizedCapacityMatch[] {
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
        provider: "DAT" as const,
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
          "DAT capacity match.",
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
