import { z } from "zod";

import { brokerageAgentNames } from "@/lib/agent-config";

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
  originAddress: z.string().trim().optional(),
  destinationCity: requiredString,
  destinationState: requiredString,
  destinationAddress: z.string().trim().optional(),
  pickupDate: z.string().trim().optional(),
  pickupWindow: z.string().trim().optional(),
  deliveryDate: z.string().trim().optional(),
  deliveryWindow: z.string().trim().optional(),
  equipmentType: requiredString,
  commodity: z.string().trim().optional(),
  weight: z.coerce.number().int().positive().optional().or(z.literal("")),
  palletCount: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  pieceCount: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  dimensions: z.string().trim().optional(),
  hazmat: z.coerce.boolean().default(false),
  temperatureRequirement: z.string().trim().optional(),
  appointmentRequired: z.coerce.boolean().default(false),
  accessorials: z.string().trim().optional(),
  customerReference: z.string().trim().optional(),
  urgency: z.string().trim().optional(),
  intakeChannel: z.string().trim().default("PHONE"),
  quotedByPhone: z.coerce.boolean().default(false),
  targetMarginPercent: z.coerce.number().nonnegative().optional().or(z.literal("")),
  pricingNotes: z.string().trim().optional(),
  specialRequirements: z.string().trim().optional(),
});

export const internalQuoteUpdateSchema = internalQuoteCreateSchema.extend({
  status: z
    .enum(["NEW", "PRICING", "QUOTED", "ACCEPTED", "REJECTED"])
    .optional(),
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

export const outboundCallCreateSchema = z.object({
  toPhone: requiredString,
  note: z.string().trim().optional(),
});

export const outboundSmsCreateSchema = z.object({
  toPhone: requiredString,
  message: requiredString,
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
  authorityStatus: z.string().trim().optional(),
  insuranceStatus: z.string().trim().optional(),
  safetyRating: z.string().trim().optional(),
  fraudRiskLevel: z.string().trim().optional(),
  lastVettedAt: z.string().trim().optional(),
  approvedBy: z.string().trim().optional(),
  complianceNotes: z.string().trim().optional(),
  preferredLanes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const carrierComplianceUpdateSchema = z.object({
  complianceStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
  authorityStatus: z.string().trim().optional(),
  insuranceStatus: z.string().trim().optional(),
  safetyRating: z.string().trim().optional(),
  fraudRiskLevel: z.string().trim().optional(),
  lastVettedAt: z.string().trim().optional(),
  approvedBy: z.string().trim().optional(),
  complianceNotes: z.string().trim().optional(),
  insuranceExpiration: z.string().trim().optional(),
  w9ReceivedAt: z.string().trim().optional(),
  agreementSignedAt: z.string().trim().optional(),
  paymentSetup: z.string().trim().optional(),
  callbackVerifiedAt: z.string().trim().optional(),
  blockedReason: z.string().trim().optional(),
  additionalContacts: z.string().trim().optional(), // JSON string for simplicity
  callbackNotes: z.string().trim().optional(),
});

export const loadCreateSchema = z.object({
  shipperCompanyName: requiredString,
  carrierCompanyName: z.string().trim().optional(),
  originCity: requiredString,
  originState: requiredString,
  originAddress: z.string().trim().optional(),
  destinationCity: requiredString,
  destinationState: requiredString,
  destinationAddress: z.string().trim().optional(),
  equipmentType: requiredString,
  commodity: z.string().trim().optional(),
  weight: z.coerce.number().int().positive().optional().or(z.literal("")),
  palletCount: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  pieceCount: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  dimensions: z.string().trim().optional(),
  hazmat: z.coerce.boolean().default(false),
  temperatureRequirement: z.string().trim().optional(),
  appointmentRequired: z.coerce.boolean().default(false),
  accessorials: z.string().trim().optional(),
  customerReference: z.string().trim().optional(),
  customerRate: z.coerce.number().nonnegative(),
  carrierRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
  pickupDate: z.string().trim().optional(),
  pickupWindow: z.string().trim().optional(),
  deliveryDate: z.string().trim().optional(),
  deliveryWindow: z.string().trim().optional(),
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

export const quoteStatusUpdateSchema = z.object({
  status: z.enum(["NEW", "PRICING", "QUOTED", "ACCEPTED", "REJECTED"]),
  note: z.string().trim().optional(),
});

export const quoteEmailSendSchema = z.object({
  toEmail: z.email(),
  subject: requiredString,
  body: requiredString,
});

export const rateBenchmarkCreateSchema = z.object({
  source: z
    .enum([
      "MANUAL",
      "INTERNAL_HISTORY",
      "DAT",
      "TRUCKSTOP",
      "CARRIER_QUOTE",
      "CUSTOMER_HISTORY",
      "OTHER",
    ])
    .default("MANUAL"),
  sourceLabel: z.string().trim().optional(),
  lowRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
  highRate: z.coerce.number().nonnegative().optional().or(z.literal("")),
  averageRate: z.coerce.number().positive(),
  confidence: z.coerce.number().min(0).max(1).optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

export const pricingRecommendationCreateSchema = z.object({
  source: z.enum(["MANUAL", "AI", "SYSTEM"]).default("MANUAL"),
  recommendedCarrierCost: z.coerce.number().positive(),
  recommendedCustomerRate: z.coerce.number().positive(),
  targetMarginPercent: z.coerce.number().nonnegative().optional().or(z.literal("")),
  riskLevel: z.string().trim().optional(),
  validForHours: z.coerce.number().int().positive().optional().or(z.literal("")),
  summary: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const marketRateFetchSchema = z.object({
  providers: z
    .array(z.enum(["DAT", "TRUCKSTOP"]))
    .min(1)
    .default(["DAT", "TRUCKSTOP"]),
});

export const documentCreateSchema = z.object({
  type: z.enum(["INVOICE", "POD", "BOL", "RATE_CONFIRMATION", "AUDIT_UPLOAD", "OTHER"]),
  fileName: requiredString,
  fileUrl: z.string().trim().optional(),
  extractedText: z.string().trim().optional(),
});

export const invoiceCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE"]).default("DRAFT"),
  dueDate: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  terms: z.string().trim().optional(),
});

export const carrierQuoteCreateSchema = z.object({
  carrierCompanyName: requiredString,
  quotedRate: z.coerce.number().positive(),
  notes: z.string().trim().optional(),
});

export const carrierSourcingCandidateCreateSchema = z.object({
  source: z
    .enum([
      "MANUAL",
      "INTERNAL_HISTORY",
      "DAT",
      "TRUCKSTOP",
      "CARRIER_NETWORK",
      "OTHER",
    ])
    .default("MANUAL"),
  companyName: requiredString,
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  mcNumber: z.string().trim().optional(),
  dotNumber: z.string().trim().optional(),
  suggestedRate: z.coerce.number().positive().optional().or(z.literal("")),
  matchScore: z.coerce.number().min(0).max(1).optional().or(z.literal("")),
  complianceSnapshot: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const carrierSourcingGenerateSchema = z.object({
  source: z.enum(["INTERNAL_HISTORY"]).default("INTERNAL_HISTORY"),
});

export const carrierCandidateRequestQuoteSchema = z.object({
  notes: z.string().trim().optional(),
});

export const customerUpdateSchema = z.object({
  customerUpdateStatus: z.enum(["NOT_NEEDED", "NEEDED", "SENT"]),
  message: requiredString,
  sentAt: z.string().trim().optional(),
});

export const rateConfirmationUpdateSchema = z.object({
  rateConfirmationStatus: z.enum(["NOT_STARTED", "DRAFTED", "SENT", "SIGNED"]),
  fileName: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const appSettingsSchema = z.object({
  callRecordingDisclosure: requiredString,
});

export const loadExceptionCreateSchema = z.object({
  type: requiredString,
  notes: z.string().trim().optional(),
});

export const loadExceptionUpdateSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "RESOLVED"]),
  ownerUserId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const quoteEmailTemplateSettingsSchema = z.object({
  subject: requiredString,
  body: requiredString,
});

export const aiAgentRunRequestSchema = z.object({
  agentName: z.enum(brokerageAgentNames),
  relatedEntityType: z.enum(["Lead", "QuoteRequest", "Load", "Carrier"]),
  relatedEntityId: requiredString,
});

export const agentPromptTemplateSchema = z.object({
  agentName: z.enum(brokerageAgentNames),
  systemPrompt: requiredString,
  task: requiredString,
  placeholderNextAction: requiredString,
});

export type FreightAuditInput = z.infer<typeof freightAuditSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type ShipperCreateInput = z.infer<typeof shipperCreateSchema>;
export type InternalQuoteCreateInput = z.infer<typeof internalQuoteCreateSchema>;
export type InternalQuoteUpdateInput = z.infer<typeof internalQuoteUpdateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type OutboundCallCreateInput = z.infer<typeof outboundCallCreateSchema>;
export type OutboundSmsCreateInput = z.infer<typeof outboundSmsCreateSchema>;
export type CarrierCreateInput = z.infer<typeof carrierCreateSchema>;
export type CarrierComplianceUpdateInput = z.infer<typeof carrierComplianceUpdateSchema>;
export type LoadCreateInput = z.infer<typeof loadCreateSchema>;
export type LoadUpdateInput = z.infer<typeof loadUpdateSchema>;
export type ShipmentEventCreateInput = z.infer<typeof shipmentEventCreateSchema>;
export type QuoteConvertInput = z.infer<typeof quoteConvertSchema>;
export type CustomerQuoteCreateInput = z.infer<typeof customerQuoteCreateSchema>;
export type QuoteStatusUpdateInput = z.infer<typeof quoteStatusUpdateSchema>;
export type QuoteEmailSendInput = z.infer<typeof quoteEmailSendSchema>;
export type RateBenchmarkCreateInput = z.infer<typeof rateBenchmarkCreateSchema>;
export type PricingRecommendationCreateInput = z.infer<typeof pricingRecommendationCreateSchema>;
export type MarketRateFetchInput = z.infer<typeof marketRateFetchSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type CarrierQuoteCreateInput = z.infer<typeof carrierQuoteCreateSchema>;
export type CarrierSourcingCandidateCreateInput = z.infer<
  typeof carrierSourcingCandidateCreateSchema
>;
export type CarrierSourcingGenerateInput = z.infer<
  typeof carrierSourcingGenerateSchema
>;
export type CarrierCandidateRequestQuoteInput = z.infer<
  typeof carrierCandidateRequestQuoteSchema
>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type RateConfirmationUpdateInput = z.infer<typeof rateConfirmationUpdateSchema>;
export type AiAgentRunRequestInput = z.infer<typeof aiAgentRunRequestSchema>;
export type AgentPromptTemplateInput = z.infer<
  typeof agentPromptTemplateSchema
>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
export type QuoteEmailTemplateSettingsInput = z.infer<
  typeof quoteEmailTemplateSettingsSchema
>;

export type LoadExceptionCreateInput = z.infer<typeof loadExceptionCreateSchema>;
export type LoadExceptionUpdateInput = z.infer<typeof loadExceptionUpdateSchema>;

export const shipperUpdateSchema = z.object({
  companyName: requiredString,
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().trim().optional(),
  portalEnabled: z.boolean().optional(),
});

export const contactUpdateSchema = z.object({
  firstName: requiredString,
  lastName: z.string().trim().optional(),
  title: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

export type ShipperUpdateInput = z.infer<typeof shipperUpdateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
