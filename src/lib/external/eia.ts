import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const EIA_API_KEY = process.env.EIA_API_KEY;
const EIA_CACHE_KEY = "eiaCache";
const EIA_CACHE_TTL_DAYS = 7;

export type EiaDieselResult = {
  configured: boolean;
  price: number | null;
  cachedAt: string | null;
  fromCache: boolean;
  error?: string;
};

export async function getEiaDieselPrice(): Promise<EiaDieselResult> {
  if (!EIA_API_KEY) {
    return { configured: false, price: null, cachedAt: null, fromCache: false };
  }

  // Check cache first
  const cached = await readCache();
  if (cached) {
    return { configured: true, price: cached.price, cachedAt: cached.fetchedAt, fromCache: true };
  }

  try {
    const url =
      `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_API_KEY}` +
      `&frequency=weekly&data[0]=value&facets[product][]=EPD2D&facets[duoarea][]=NUS` +
      `&sort[0][column]=period&sort[0][direction]=desc&length=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA API ${res.status}`);

    const json = (await res.json()) as { response?: { data?: { value?: string }[] } };
    const raw = json?.response?.data?.[0]?.value;
    if (!raw) throw new Error("EIA response missing value");

    const price = parseFloat(raw);
    if (isNaN(price)) throw new Error("EIA returned non-numeric price");

    const fetchedAt = new Date().toISOString();
    await writeCache({ price, fetchedAt });

    return { configured: true, price, cachedAt: fetchedAt, fromCache: false };
  } catch (err) {
    return {
      configured: true,
      price: null,
      cachedAt: null,
      fromCache: false,
      error: err instanceof Error ? err.message : "EIA fetch failed",
    };
  }
}

export function calcFuelSurcharge(dieselPricePerGallon: number, miles: number): number {
  // Standard freight fuel surcharge formula: (diesel - $1.20 base) / 6 mpg * miles
  const surchargePerMile = Math.max(0, (dieselPricePerGallon - 1.2) / 6);
  return Math.round(surchargePerMile * miles * 100) / 100;
}

type EiaCacheEntry = { price: number; fetchedAt: string };

async function readCache(): Promise<EiaCacheEntry | null> {
  if (!hasDatabaseUrl() || !prisma) return null;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: EIA_CACHE_KEY } });
    if (!setting?.value) return null;
    const entry = JSON.parse(setting.value) as EiaCacheEntry;
    const ageDays = (Date.now() - new Date(entry.fetchedAt).getTime()) / 86400000;
    if (ageDays > EIA_CACHE_TTL_DAYS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(entry: EiaCacheEntry): Promise<void> {
  if (!hasDatabaseUrl() || !prisma) return;
  try {
    await prisma.appSetting.upsert({
      where: { key: EIA_CACHE_KEY },
      create: { key: EIA_CACHE_KEY, value: JSON.stringify(entry) },
      update: { value: JSON.stringify(entry) },
    });
  } catch {
    // Cache write failure is non-fatal
  }
}
