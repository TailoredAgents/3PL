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

export type FreightAuditInput = z.infer<typeof freightAuditSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type ShipperCreateInput = z.infer<typeof shipperCreateSchema>;
export type InternalQuoteCreateInput = z.infer<typeof internalQuoteCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
