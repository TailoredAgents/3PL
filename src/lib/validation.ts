import { z } from "zod";

const requiredString = z.string().trim().min(1);

export const freightAuditSchema = z.object({
  companyName: requiredString,
  contactName: requiredString,
  email: z.email(),
  phone: requiredString,
  lanes: requiredString,
  equipmentType: requiredString,
  monthlyVolume: z.string().trim().optional(),
  documents: z
    .array(
      z.object({
        name: requiredString,
        size: z.number().nonnegative(),
        type: z.string(),
      }),
    )
    .min(1)
    .max(5),
});

export const quoteRequestSchema = z.object({
  companyName: requiredString,
  email: z.email(),
  origin: requiredString,
  destination: requiredString,
  pickupDate: z.string().trim().optional(),
  equipmentType: requiredString,
  weight: z.string().trim().optional(),
  details: z.string().trim().optional(),
});

export const leadCreateSchema = z.object({
  companyName: requiredString,
  contactName: requiredString,
  title: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"]),
  source: z.enum(["AUDIT", "QUOTE_FORM", "REFERRAL", "MANUAL", "OUTBOUND"]),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  lanes: z.string().trim().optional(),
  equipmentType: z.string().trim().optional(),
  monthlyVolume: z.string().trim().optional(),
  nextFollowUpAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const shipperCreateSchema = z.object({
  companyName: requiredString,
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  contactName: requiredString,
  title: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  lanes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const internalQuoteCreateSchema = z.object({
  companyName: requiredString,
  contactName: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  originCity: requiredString,
  originState: requiredString,
  destinationCity: requiredString,
  destinationState: requiredString,
  pickupDate: z.string().trim().optional(),
  equipmentType: requiredString,
  commodity: z.string().trim().optional(),
  weight: z.coerce.number().int().positive().optional().or(z.literal("")),
  specialRequirements: z.string().trim().optional(),
});

export const leadUpdateSchema = z.object({
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"]),
  priority: z.coerce.number().int().min(1).max(5),
  nextFollowUpAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const activityCreateSchema = z.object({
  type: z.enum(["CALL", "EMAIL", "SMS", "NOTE", "AI_TOUCH", "MEETING"]),
  direction: z
    .enum(["INBOUND", "OUTBOUND", "INTERNAL"])
    .default("INTERNAL"),
  subject: z.string().trim().optional(),
  body: requiredString,
  outcome: z.string().trim().optional(),
});

export const carrierCreateSchema = z.object({
  companyName: requiredString,
  mcNumber: z.string().trim().optional(),
  dotNumber: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  complianceStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"])
    .default("PENDING"),
  preferredLanes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const loadCreateSchema = z.object({
  shipperCompanyName: requiredString,
  carrierCompanyName: z.string().trim().optional(),
  originCity: requiredString,
  originState: requiredString,
  destinationCity: requiredString,
  destinationState: requiredString,
  equipmentType: requiredString,
  customerRate: z.coerce.number().nonnegative(),
  carrierRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
  pickupDate: z.string().trim().optional(),
  deliveryDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const loadUpdateSchema = z.object({
  status: z.enum([
    "TENDERED",
    "BOOKED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "POD_RECEIVED",
    "INVOICED",
    "PAID",
  ]),
  carrierCompanyName: z.string().trim().optional(),
  carrierRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
  deliveryDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const shipmentEventCreateSchema = z.object({
  type: z.enum([
    "PICKUP_CONFIRMED",
    "LOCATION_UPDATE",
    "DELAY",
    "DELIVERED",
    "POD_UPLOADED",
  ]),
  message: requiredString,
  location: z.string().trim().optional(),
  occurredAt: z.string().trim().optional(),
});

export const quoteConvertSchema = z.object({
  customerRate: z.coerce.number().nonnegative(),
  carrierCompanyName: z.string().trim().optional(),
  carrierRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
});

export const customerQuoteCreateSchema = z.object({
  quotedRate: z.coerce.number().positive(),
  targetCarrierCost: z.coerce.number().nonnegative().optional().or(z.literal("")),
  validUntil: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const documentCreateSchema = z.object({
  type: z.enum(["INVOICE", "POD", "RATE_CONFIRMATION", "AUDIT_UPLOAD", "OTHER"]),
  fileName: requiredString,
  fileUrl: z.string().trim().optional(),
  extractedText: z.string().trim().optional(),
});

export const invoiceCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE"]).default("DRAFT"),
  dueDate: z.string().trim().optional(),
});

export const carrierQuoteCreateSchema = z.object({
  carrierCompanyName: requiredString,
  quotedRate: z.coerce.number().positive(),
  notes: z.string().trim().optional(),
});

export const aiAgentRunRequestSchema = z.object({
  agentName: z.enum([
    "Sales Follow-Up Agent",
    "Quote Pricing Agent",
    "Carrier Coverage Agent",
    "Load Tracking Agent",
    "Billing Readiness Agent",
    "Carrier Compliance Agent",
  ]),
  relatedEntityType: z.enum(["Lead", "QuoteRequest", "Load", "Carrier"]),
  relatedEntityId: requiredString,
});

export type FreightAuditInput = z.infer<typeof freightAuditSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type ShipperCreateInput = z.infer<typeof shipperCreateSchema>;
export type InternalQuoteCreateInput = z.infer<typeof internalQuoteCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type CarrierCreateInput = z.infer<typeof carrierCreateSchema>;
export type LoadCreateInput = z.infer<typeof loadCreateSchema>;
export type LoadUpdateInput = z.infer<typeof loadUpdateSchema>;
export type ShipmentEventCreateInput = z.infer<typeof shipmentEventCreateSchema>;
export type QuoteConvertInput = z.infer<typeof quoteConvertSchema>;
export type CustomerQuoteCreateInput = z.infer<typeof customerQuoteCreateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type CarrierQuoteCreateInput = z.infer<typeof carrierQuoteCreateSchema>;
export type AiAgentRunRequestInput = z.infer<typeof aiAgentRunRequestSchema>;
