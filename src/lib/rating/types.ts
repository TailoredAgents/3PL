export type MarketRateRequest = {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  pickupDate?: Date | null;
  equipmentType: string;
  weight?: number | null;
};

export type NormalizedMarketRate = {
  provider: "DAT" | "TRUCKSTOP";
  sourceLabel: string;
  lowRate?: number | null;
  highRate?: number | null;
  averageRate: number;
  confidence?: number | null;
  notes?: string | null;
  raw?: unknown;
};

export type MarketRateProviderResult = {
  provider: "DAT" | "TRUCKSTOP";
  configured: boolean;
  rates: NormalizedMarketRate[];
  error?: string;
};
