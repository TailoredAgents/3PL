export type MarketplaceProvider = "DAT" | "TRUCKSTOP";

export type MarketplaceLoadRequest = {
  loadId: string;
  originCity: string;
  originState: string;
  originAddress?: string | null;
  destinationCity: string;
  destinationState: string;
  destinationAddress?: string | null;
  pickupDate?: Date | null;
  pickupWindow?: string | null;
  deliveryDate?: Date | null;
  deliveryWindow?: string | null;
  equipmentType: string;
  commodity?: string | null;
  weight?: number | null;
  palletCount?: number | null;
  pieceCount?: number | null;
  dimensions?: string | null;
  hazmat: boolean;
  temperatureRequirement?: string | null;
  appointmentRequired: boolean;
  accessorials?: string | null;
  customerReference?: string | null;
  carrierRate?: number | null;
};

export type NormalizedCapacityMatch = {
  provider: MarketplaceProvider;
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  suggestedRate?: number | null;
  matchScore?: number | null;
  notes?: string | null;
  raw?: unknown;
};

export type MarketplaceCapacityResult = {
  provider: MarketplaceProvider;
  configured: boolean;
  matches: NormalizedCapacityMatch[];
  raw?: unknown;
  error?: string;
};

export type MarketplacePostResult = {
  provider: MarketplaceProvider;
  configured: boolean;
  posted: boolean;
  externalId?: string | null;
  message?: string | null;
  raw?: unknown;
  error?: string;
};
