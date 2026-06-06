import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const HERE_API_KEY = process.env.HERE_API_KEY;

export type HereMileageResult = {
  configured: boolean;
  miles: number | null;
  fromCache: boolean;
  error?: string;
};

export async function getTruckMileage(
  origin: string,
  destination: string,
): Promise<HereMileageResult> {
  if (!HERE_API_KEY) {
    return { configured: false, miles: null, fromCache: false };
  }

  const cacheKey = buildCacheKey(origin, destination);

  const cached = await readMileageCache(cacheKey);
  if (cached !== null) {
    return { configured: true, miles: cached, fromCache: true };
  }

  try {
    // Geocode origin and destination
    const [originCoords, destCoords] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    if (!originCoords || !destCoords) {
      throw new Error("Could not geocode origin or destination");
    }

    // Request truck route
    const routeUrl =
      `https://router.hereapi.com/v8/routes` +
      `?transportMode=truck` +
      `&origin=${originCoords.lat},${originCoords.lng}` +
      `&destination=${destCoords.lat},${destCoords.lng}` +
      `&return=summary` +
      `&apikey=${HERE_API_KEY}`;

    const res = await fetch(routeUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HERE Routing API ${res.status}`);

    const json = (await res.json()) as {
      routes?: { sections?: { summary?: { length?: number } }[] }[];
    };

    const meters = json?.routes?.[0]?.sections?.[0]?.summary?.length;
    if (!meters) throw new Error("HERE returned no route length");

    const miles = Math.round((meters / 1609.344) * 10) / 10;

    await writeMileageCache(cacheKey, miles);

    return { configured: true, miles, fromCache: false };
  } catch (err) {
    return {
      configured: true,
      miles: null,
      fromCache: false,
      error: err instanceof Error ? err.message : "HERE fetch failed",
    };
  }
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  const url =
    `https://geocode.search.hereapi.com/v1/geocode` +
    `?q=${encodeURIComponent(location)}` +
    `&apikey=${HERE_API_KEY}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    items?: { position?: { lat: number; lng: number } }[];
  };

  const pos = json?.items?.[0]?.position;
  if (!pos) return null;
  return { lat: pos.lat, lng: pos.lng };
}

function buildCacheKey(origin: string, destination: string): string {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
  return `mileageCache:${normalize(origin)}:${normalize(destination)}`;
}

async function readMileageCache(key: string): Promise<number | null> {
  if (!hasDatabaseUrl() || !prisma) return null;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    if (!setting?.value) return null;
    const miles = parseFloat(setting.value);
    return isNaN(miles) ? null : miles;
  } catch {
    return null;
  }
}

async function writeMileageCache(key: string, miles: number): Promise<void> {
  if (!hasDatabaseUrl() || !prisma) return;
  try {
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(miles) },
      update: { value: String(miles) },
    });
  } catch {
    // Cache write failure is non-fatal
  }
}
