import { Prisma } from "@prisma/client";

import type { BrokerageAgentName } from "@/lib/agent-config";
import type { AgentEntityType } from "@/lib/agent-workflow";
import { getCarrierRiskProfile } from "@/lib/external/carrierok";
import { getEiaDieselPrice, calcFuelSurcharge } from "@/lib/external/eia";
import { lookupCarrierByDot, lookupCarrierByMc } from "@/lib/external/fmcsa";
import { getTruckMileage } from "@/lib/external/here";
import { logIntegration } from "@/lib/integrations/logging";
import {
  getTruckstopRateIntelligence,
  getTruckstopCarrierRisk,
  getTruckstopEldPosition,
} from "@/lib/external/truckstop";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type EnrichedAgentContext = {
  base: unknown;
  enrichment: Record<string, unknown>;
  dataAvailability: Record<string, boolean | string>;
};

export async function enrichAgentContext(
  agentName: BrokerageAgentName,
  entityType: AgentEntityType,
  entityId: string,
  baseContext: unknown,
): Promise<EnrichedAgentContext> {
  try {
    switch (agentName) {
      case "Sales Follow-Up Agent":
        return enrichSalesFollowUp(entityId, baseContext);
      case "Quote Pricing Agent":
        return enrichQuotePricing(entityId, entityType, baseContext);
      case "Carrier Coverage Agent":
        return enrichCarrierCoverage(entityId, baseContext);
      case "Rate Confirmation Agent":
        return enrichRateConfirmation(entityId, baseContext);
      case "Carrier Dispatch Agent":
        return enrichCarrierDispatch(entityId, baseContext);
      case "Load Tracking Agent":
        return enrichLoadTracking(entityId, baseContext);
      case "Billing Readiness Agent":
        return enrichBillingReadiness(entityId, baseContext);
      case "Carrier Compliance Agent":
        return enrichCarrierCompliance(entityId, baseContext);
      case "Conversation Notes Agent":
        return enrichConversationNotes(entityId, baseContext);
      default:
        return { base: baseContext, enrichment: {}, dataAvailability: {} };
    }
  } catch {
    return { base: baseContext, enrichment: {}, dataAvailability: { error: "enrichment_failed" } };
  }
}

// ─── Rate Confirmation Agent ───────────────────────────────────────────────

async function enrichRateConfirmation(
  loadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  if (!hasDatabaseUrl() || !prisma) {
    return { base, enrichment, dataAvailability };
  }

  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        shipper: { select: { companyName: true } },
        carrier: {
          select: {
            companyName: true,
            contactName: true,
            email: true,
            complianceStatus: true,
            blockedReason: true,
          },
        },
        documents: {
          where: { type: "RATE_CONFIRMATION" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            fileName: true,
            mimeType: true,
            fileUrl: true,
            extractedText: true,
            createdAt: true,
          },
        },
      },
    });

    if (!load) {
      dataAvailability.rateConfirmationReadiness = "load_not_found";
      return { base, enrichment, dataAvailability };
    }

    const latestDocument = load.documents[0];
    const draftBlockers = [
      !load.carrier ? "Assign a carrier" : null,
      load.carrier && load.carrier.complianceStatus !== "APPROVED"
        ? "Approve carrier compliance"
        : null,
      load.carrier?.blockedReason
        ? `Resolve carrier block: ${load.carrier.blockedReason}`
        : null,
      !load.carrierRate ? "Enter carrier rate" : null,
    ].filter(Boolean);
    const sendBlockers = [
      ...draftBlockers,
      !latestDocument?.extractedText ? "Generate rate confirmation PDF" : null,
      !load.carrier?.email ? "Add carrier dispatch email" : null,
      !load.pickupDate ? "Enter pickup date" : null,
      !load.deliveryDate ? "Enter delivery date" : null,
      !load.originAddress ? "Enter pickup address" : null,
      !load.destinationAddress ? "Enter delivery address" : null,
    ].filter(Boolean);

    enrichment.rateConfirmationReadiness = {
      loadNumber: `LD-${String(load.loadNumber).padStart(4, "0")}`,
      shipper: load.shipper.companyName,
      carrier: load.carrier?.companyName ?? null,
      carrierContact: load.carrier?.contactName ?? null,
      carrierEmail: load.carrier?.email ?? null,
      carrierComplianceStatus: load.carrier?.complianceStatus ?? null,
      lane: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
      carrierRate: load.carrierRate ? Number(load.carrierRate) : null,
      rateConfirmationStatus: load.rateConfirmationStatus,
      rateConfirmationSentAt: load.rateConfirmationSentAt?.toISOString() ?? null,
      rateConfirmationSignedAt:
        load.rateConfirmationSignedAt?.toISOString() ?? null,
      hasPdfDocument: Boolean(latestDocument?.extractedText),
      documentFileName: latestDocument?.fileName ?? null,
      documentMimeType: latestDocument?.mimeType ?? null,
      documentUrl: latestDocument?.fileUrl ?? null,
      draftReady: draftBlockers.length === 0,
      sendReady: sendBlockers.length === 0,
      draftBlockers,
      sendBlockers,
      approvalEffect:
        draftBlockers.length === 0 && !latestDocument?.extractedText
          ? "Approving this run can draft the PDF. It will not send carrier email."
          : "Approval records broker review. Carrier email remains manual.",
    };
    dataAvailability.rateConfirmationReadiness = true;
  } catch {
    dataAvailability.rateConfirmationReadiness = "failed";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Carrier Dispatch Agent ────────────────────────────────────────────────

async function enrichCarrierDispatch(
  loadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  if (!hasDatabaseUrl() || !prisma) {
    return { base, enrichment, dataAvailability };
  }

  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        shipper: { select: { companyName: true } },
        carrier: {
          select: {
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            complianceStatus: true,
            blockedReason: true,
          },
        },
        documents: {
          where: { type: "RATE_CONFIRMATION" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            fileName: true,
            fileUrl: true,
            extractedText: true,
            createdAt: true,
          },
        },
        events: {
          orderBy: { occurredAt: "desc" },
          take: 5,
          select: {
            type: true,
            message: true,
            location: true,
            occurredAt: true,
          },
        },
        exceptions: {
          orderBy: { createdAt: "desc" },
          select: {
            type: true,
            status: true,
            notes: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
    });

    if (!load) {
      dataAvailability.carrierDispatch = "load_not_found";
      return { base, enrichment, dataAvailability };
    }

    const latestRateConfirmation = load.documents[0];
    const openExceptions = load.exceptions.filter(
      (exception) => exception.status !== "RESOLVED",
    );
    const hasDispatchContact = Boolean(load.carrier?.email || load.carrier?.phone);
    const trackingChannelAvailable = Boolean(load.pickupDate && hasDispatchContact);
    const blockers = [
      !load.carrier ? "Assign a carrier" : null,
      load.carrier && load.carrier.complianceStatus !== "APPROVED"
        ? "Approve carrier compliance"
        : null,
      load.carrier?.blockedReason
        ? `Resolve carrier block: ${load.carrier.blockedReason}`
        : null,
      !load.carrierRate ? "Enter carrier rate" : null,
      load.rateConfirmationStatus !== "SIGNED"
        ? "Collect signed rate confirmation"
        : null,
      !load.pickupDate ? "Enter pickup date" : null,
      !load.pickupWindow ? "Confirm pickup window or appointment" : null,
      !load.deliveryDate ? "Enter delivery date" : null,
      !load.deliveryWindow ? "Confirm delivery window or appointment" : null,
      !load.originAddress ? "Enter pickup address" : null,
      !load.destinationAddress ? "Enter delivery address" : null,
      !load.carrier?.contactName ? "Add dispatcher contact name" : null,
      !hasDispatchContact ? "Add dispatcher phone or email" : null,
      !trackingChannelAvailable
        ? "Confirm tracking/check-call channel before pickup"
        : null,
      openExceptions.length
        ? `Resolve ${openExceptions.length} open exception(s)`
        : null,
    ].filter((blocker): blocker is string => Boolean(blocker));

    enrichment.carrierDispatch = {
      loadNumber: `LD-${String(load.loadNumber).padStart(4, "0")}`,
      shipper: load.shipper.companyName,
      carrier: load.carrier?.companyName ?? null,
      carrierContactName: load.carrier?.contactName ?? null,
      carrierEmail: load.carrier?.email ?? null,
      carrierPhone: load.carrier?.phone ?? null,
      carrierComplianceStatus: load.carrier?.complianceStatus ?? null,
      carrierBlockedReason: load.carrier?.blockedReason ?? null,
      lane: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
      equipment: load.equipmentType,
      pickupDate: load.pickupDate?.toISOString() ?? null,
      pickupWindow: load.pickupWindow ?? null,
      pickupAddress: load.originAddress ?? null,
      deliveryDate: load.deliveryDate?.toISOString() ?? null,
      deliveryWindow: load.deliveryWindow ?? null,
      deliveryAddress: load.destinationAddress ?? null,
      carrierRate: load.carrierRate ? Number(load.carrierRate) : null,
      customerRate: load.customerRate ? Number(load.customerRate) : null,
      rateConfirmationStatus: load.rateConfirmationStatus,
      rateConfirmationSentAt: load.rateConfirmationSentAt?.toISOString() ?? null,
      rateConfirmationSignedAt:
        load.rateConfirmationSignedAt?.toISOString() ?? null,
      hasRateConfirmationPdf: Boolean(latestRateConfirmation?.extractedText),
      rateConfirmationFileName: latestRateConfirmation?.fileName ?? null,
      rateConfirmationUrl: latestRateConfirmation?.fileUrl ?? null,
      trackingChannelAvailable,
      dispatchReady: blockers.length === 0,
      blockers,
      openExceptions: openExceptions.map((exception) => ({
        type: exception.type,
        status: exception.status,
        notes: exception.notes,
        createdAt: exception.createdAt.toISOString(),
      })),
      recentEvents: load.events.map((event) => ({
        type: event.type,
        message: event.message,
        location: event.location,
        occurredAt: event.occurredAt.toISOString(),
      })),
      approvalEffect:
        blockers.length === 0
          ? "Approval records broker dispatch review. It does not release pickup instructions, send customer updates, or change load status."
          : "Approval records broker review only. Clear blockers before dispatch release.",
    };
    dataAvailability.carrierDispatch = true;
  } catch {
    dataAvailability.carrierDispatch = "failed";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Sales Follow-Up Agent ─────────────────────────────────────────────────

async function enrichSalesFollowUp(
  leadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  if (!hasDatabaseUrl() || !prisma) {
    return { base, enrichment, dataAvailability };
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
        shipper: {
          include: {
            quoteRequests: { orderBy: { createdAt: "desc" }, take: 10 },
          },
        },
      },
    });

    if (lead) {
      const now = new Date();
      const lastActivity = lead.activities[0];
      const daysSinceLastContact = lastActivity
        ? Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / 86400000)
        : null;

      const openQuotes = lead.shipper.quoteRequests.filter(
        (q) => q.status !== "REJECTED",
      );

      enrichment.fullActivityLog = lead.activities.map((a) => ({
        type: a.type,
        subject: a.subject,
        body: a.body,
        outcome: a.outcome,
        createdAt: a.createdAt.toISOString(),
      }));
      enrichment.daysSinceLastContact = daysSinceLastContact;
      enrichment.openQuoteCount = openQuotes.length;
      enrichment.recentQuotes = lead.shipper.quoteRequests.slice(0, 5).map((q) => ({
        origin: `${q.originCity}, ${q.originState}`,
        destination: `${q.destinationCity}, ${q.destinationState}`,
        status: q.status,
        createdAt: q.createdAt.toISOString(),
      }));

      dataAvailability.activityLog = true;
      dataAvailability.quoteHistory = true;
    }
  } catch {
    dataAvailability.activityLog = "failed";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Quote Pricing Agent ───────────────────────────────────────────────────

async function enrichQuotePricing(
  entityId: string,
  entityType: AgentEntityType,
  base: unknown,
): Promise<EnrichedAgentContext> {
  if (entityType === "Lead") {
    return enrichQuotePricingFromLead(entityId, base);
  }
  return enrichQuotePricingFromQuoteRequest(entityId, base);
}

async function enrichQuotePricingFromQuoteRequest(
  quoteId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  const ctx = base as Record<string, unknown>;
  const originCity = (ctx.originCity as string) ?? "";
  const originState = (ctx.originState as string) ?? "";
  const destinationCity = (ctx.destinationCity as string) ?? "";
  const destinationState = (ctx.destinationState as string) ?? "";
  const equipment = (ctx.equipment as string) ?? "";

  const origin = `${originCity}, ${originState}`.trim();
  const destination = `${destinationCity}, ${destinationState}`.trim();

  const [mileageResult, dieselResult, rateResult] = await Promise.allSettled([
    getTruckMileage(origin, destination),
    getEiaDieselPrice(),
    getTruckstopRateIntelligence(originCity, originState, destinationCity, destinationState, equipment),
  ]);

  const mileage = mileageResult.status === "fulfilled" ? mileageResult.value : null;
  const diesel = dieselResult.status === "fulfilled" ? dieselResult.value : null;

  // Log HERE and EIA for integrations monitoring
  if (mileage) {
    const hasError = !!mileage.error;
    await logIntegration({
      provider: "HERE",
      action: "HEALTH_CHECK",
      status: hasError ? "FAILED" : mileage.miles ? "SUCCESS" : "SKIPPED",
      message: mileage.miles ? `HERE mileage: ${mileage.miles} (cached: ${mileage.fromCache})` : "No HERE mileage",
      error: mileage.error ?? null,
    });
  }
  if (diesel) {
    const hasError = !!diesel.error;
    await logIntegration({
      provider: "EIA",
      action: "HEALTH_CHECK",
      status: hasError ? "FAILED" : diesel.price ? "SUCCESS" : "SKIPPED",
      message: diesel.price ? `EIA diesel: $${diesel.price} (cached: ${diesel.fromCache})` : "No EIA price",
      error: diesel.error ?? null,
    });
  }
  const rate = rateResult.status === "fulfilled" ? rateResult.value : null;

  if (mileage?.miles) {
    enrichment.truckMiles = mileage.miles;
    enrichment.mileageFromCache = mileage.fromCache;
    dataAvailability.mileage = true;
  } else {
    dataAvailability.mileage = mileage?.configured ? "failed" : "not_configured";
  }

  if (diesel?.price) {
    enrichment.dieselPricePerGallon = diesel.price;
    enrichment.dieselPriceDate = diesel.cachedAt;
    dataAvailability.dieselPrice = true;
    if (mileage?.miles) {
      enrichment.fuelSurchargeEstimate = calcFuelSurcharge(diesel.price, mileage.miles);
      dataAvailability.fuelSurcharge = true;
    } else {
      dataAvailability.fuelSurcharge = "no_mileage";
    }
  } else {
    dataAvailability.dieselPrice = diesel?.configured ? "failed" : "not_configured";
  }

  if (rate?.configured && !rate.error) {
    enrichment.truckstopSpotRate = {
      bookedRateEstimate: rate.bookedRateEstimate,
      postedRateEstimate: rate.postedRateEstimate,
      trendDirection: rate.trendDirection,
    };
    dataAvailability.spotRate = true;
  } else {
    dataAvailability.spotRate = rate?.configured ? "failed" : "not_configured";
  }

  if (hasDatabaseUrl() && prisma) {
    try {
      const quoteRequest = await prisma.quoteRequest.findUnique({
        where: { id: quoteId },
        select: { originCity: true, originState: true, destinationCity: true, destinationState: true, equipmentType: true },
      });

      if (quoteRequest) {
        let laneLoads = await prisma.load.findMany({
          where: {
            originCity: { equals: quoteRequest.originCity ?? "", mode: "insensitive" },
            originState: quoteRequest.originState ?? "",
            destinationCity: { equals: quoteRequest.destinationCity ?? "", mode: "insensitive" },
            destinationState: quoteRequest.destinationState ?? "",
            equipmentType: { equals: quoteRequest.equipmentType ?? "", mode: "insensitive" },
            status: "DELIVERED",
          },
          orderBy: { pickupDate: "desc" },
          take: 10,
          select: { carrierRate: true, customerRate: true, grossProfit: true, pickupDate: true },
        });

        if (laneLoads.length < 3) {
          const broader = await prisma.load.findMany({
            where: {
              originState: quoteRequest.originState ?? "",
              destinationState: quoteRequest.destinationState ?? "",
              equipmentType: { equals: quoteRequest.equipmentType ?? "", mode: "insensitive" },
              status: "DELIVERED",
            },
            orderBy: { pickupDate: "desc" },
            take: 10,
            select: { carrierRate: true, customerRate: true, grossProfit: true, pickupDate: true },
          });
          laneLoads = broader;
          enrichment.laneHistoryScope = "state_pair_fallback";
        }

        if (laneLoads.length > 0) {
          const rates = laneLoads.map((l) => ({
            buyRate: Number(l.carrierRate),
            sellRate: Number(l.customerRate),
            grossProfit: l.grossProfit ? Number(l.grossProfit) : null,
            date: l.pickupDate?.toISOString().slice(0, 10) ?? null,
          }));
          enrichment.internalLaneHistory = {
            loads: rates,
            avgBuyRate: avg(rates.map((r) => r.buyRate).filter((v) => v > 0)),
            avgSellRate: avg(rates.map((r) => r.sellRate).filter((v) => v > 0)),
          };
          dataAvailability.laneHistory = true;
        } else {
          dataAvailability.laneHistory = "no_history";
        }
      }
    } catch {
      dataAvailability.laneHistory = "failed";
    }
  }

  return { base, enrichment, dataAvailability };
}

async function enrichQuotePricingFromLead(
  leadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  // Diesel price is always useful even without a specific lane
  const dieselResult = await Promise.allSettled([getEiaDieselPrice()]);
  const diesel = dieselResult[0].status === "fulfilled" ? dieselResult[0].value : null;

  if (diesel) {
    const hasError = !!diesel.error;
    await logIntegration({
      provider: "EIA",
      action: "HEALTH_CHECK",
      status: hasError ? "FAILED" : diesel.price ? "SUCCESS" : "SKIPPED",
      message: diesel.price ? `EIA diesel: $${diesel.price} (cached: ${diesel.fromCache})` : "No EIA price",
      error: diesel.error ?? null,
    });
  }

  if (diesel?.price) {
    enrichment.dieselPricePerGallon = diesel.price;
    enrichment.dieselPriceDate = diesel.cachedAt;
    dataAvailability.dieselPrice = true;
  } else {
    dataAvailability.dieselPrice = diesel?.configured ? "failed" : "not_configured";
  }

  // Mileage and spot rate need exact origin/dest — not available from a lead
  dataAvailability.mileage = "needs_specific_origin_dest";
  dataAvailability.spotRate = "needs_specific_origin_dest";
  dataAvailability.fuelSurcharge = "needs_mileage";
  enrichment.pricingNote =
    "Running from lead context — no specific origin/dest. Provide exact cities to calculate mileage, spot rate, and fuel surcharge.";

  if (hasDatabaseUrl() && prisma) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          shipper: {
            include: {
              quoteRequests: { orderBy: { createdAt: "desc" }, take: 10 },
              loads: {
                where: { status: "DELIVERED" },
                orderBy: { pickupDate: "desc" },
                take: 10,
                select: { carrierRate: true, customerRate: true, grossProfit: true, pickupDate: true, originCity: true, originState: true, destinationCity: true, destinationState: true },
              },
            },
          },
        },
      });

      if (lead) {
        enrichment.leadLanes = (lead as Record<string, unknown>).lanes;
        enrichment.leadEquipment = (lead as Record<string, unknown>).equipment;

        const shipperLoads = lead.shipper.loads;
        if (shipperLoads.length > 0) {
          const rates = shipperLoads.map((l) => ({
            buyRate: Number(l.carrierRate),
            sellRate: Number(l.customerRate),
            grossProfit: l.grossProfit ? Number(l.grossProfit) : null,
            date: l.pickupDate?.toISOString().slice(0, 10) ?? null,
            lane: `${l.originCity ?? ""}, ${l.originState ?? ""} → ${l.destinationCity ?? ""}, ${l.destinationState ?? ""}`,
          }));
          enrichment.shipperLoadHistory = {
            loads: rates,
            avgBuyRate: avg(rates.map((r) => r.buyRate).filter((v) => v > 0)),
            avgSellRate: avg(rates.map((r) => r.sellRate).filter((v) => v > 0)),
          };
          dataAvailability.laneHistory = true;
        } else {
          dataAvailability.laneHistory = "no_history";
        }

        enrichment.recentQuotes = lead.shipper.quoteRequests.slice(0, 5).map((q) => ({
          origin: `${q.originCity ?? ""}, ${q.originState ?? ""}`,
          destination: `${q.destinationCity ?? ""}, ${q.destinationState ?? ""}`,
          status: q.status,
          createdAt: q.createdAt.toISOString(),
        }));
      }
    } catch {
      dataAvailability.laneHistory = "failed";
    }
  }

  return { base, enrichment, dataAvailability };
}

// ─── Conversation Notes Agent ─────────────────────────────────────────────

const COMMS_TYPES = ["CALL", "EMAIL", "SMS", "NOTE"];

async function enrichConversationNotes(
  leadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  if (!hasDatabaseUrl() || !prisma) {
    return { base, enrichment, dataAvailability };
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (lead) {
      // Prefer most recent communication/note entry, fall back to any activity.
      const latestComms = lead.activities.find((a) => COMMS_TYPES.includes(a.type));
      const source = latestComms ?? lead.activities[0] ?? null;

      enrichment.rawCallNotes = source?.body ?? null;
      enrichment.callSubject = source?.subject ?? null;
      enrichment.callOutcome = source?.outcome ?? null;
      enrichment.callType = source?.type ?? null;
      enrichment.recentActivities = lead.activities.slice(0, 5).map((a) => ({
        type: a.type,
        subject: a.subject,
        body: a.body,
        outcome: a.outcome,
        createdAt: a.createdAt.toISOString(),
      }));

      dataAvailability.rawCallNotes = Boolean(source?.body);
      dataAvailability.activityHistory = lead.activities.length > 0;
      dataAvailability.channelType = source?.type ?? "unknown";
    }
  } catch {
    dataAvailability.conversationNotes = "failed";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Carrier Coverage Agent ────────────────────────────────────────────────

async function enrichCarrierCoverage(
  loadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  const ctx = base as Record<string, unknown>;
  const candidates = (ctx.carrierCandidates as Array<Record<string, unknown>>) ?? [];

  // Cap at 10 candidates by matchScore
  const top = candidates.slice(0, 10);

  const candidateEnrichments = await Promise.allSettled(
    top.map(async (candidate) => {
      const dot = candidate.dotNumber as string | null;
      const mc = candidate.mcNumber as string | null;
      const carrierId = candidate.carrierId as string | null;

      const [fmcsa, carrierOk, truckstopRisk, history] = await Promise.allSettled([
        dot ? lookupCarrierByDot(dot) : mc ? lookupCarrierByMc(mc) : Promise.resolve({ configured: false, found: false }),
        getCarrierRiskProfile(mc, dot),
        mc ? getTruckstopCarrierRisk(mc) : Promise.resolve({ configured: false, found: false }),
        carrierId ? getCarrierHistory(carrierId) : Promise.resolve(null),
      ]);

      // Log FMCSA result for integrations monitoring
      const fmcsaRes = fmcsa.status === "fulfilled" ? fmcsa.value : null;
      if (fmcsaRes) {
        const hasError = "error" in fmcsaRes && !!fmcsaRes.error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = fmcsaRes as any;
        await logIntegration({
          provider: "FMCSA",
          action: "CARRIER_RESPONSE_SYNC",
          status: hasError ? "FAILED" : fmcsaRes.found ? "SUCCESS" : "SKIPPED",
          message: fmcsaRes.found ? `FMCSA data for ${f.dotNumber || f.mcNumber || ""}` : "No FMCSA match",
          error: hasError ? f.error : null,
        });
      }

      return {
        candidateId: candidate.id,
        companyName: candidate.companyName,
        fmcsa: fmcsa.status === "fulfilled" ? strip(fmcsa.value) : { error: "fetch_failed" },
        carrierOk: carrierOk.status === "fulfilled" ? strip(carrierOk.value) : { error: "fetch_failed" },
        truckstopRisk: truckstopRisk.status === "fulfilled" ? strip(truckstopRisk.value) : null,
        loadHistory: history.status === "fulfilled" ? history.value : null,
      };
    }),
  );

  enrichment.candidateCompliance = candidateEnrichments
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);

  dataAvailability.candidateCompliance = enrichment.candidateCompliance ? true : "failed";

  return { base, enrichment, dataAvailability };
}

// ─── Load Tracking Agent ───────────────────────────────────────────────────

async function enrichLoadTracking(
  loadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  const ctx = base as Record<string, unknown>;
  const events = (ctx.events as Array<Record<string, unknown>>) ?? [];
  const lastEvent = events[0];

  if (lastEvent?.time) {
    const now = new Date();
    const lastTime = new Date(lastEvent.time as string);
    if (!isNaN(lastTime.getTime())) {
      enrichment.hoursSinceLastEvent = Math.round((now.getTime() - lastTime.getTime()) / 3600000);
    }
  }

  // Get carrier mcNumber for ELD lookup
  if (hasDatabaseUrl() && prisma) {
    try {
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        select: {
          carrier: { select: { mcNumber: true, dotNumber: true } },
          originCity: true, originState: true,
          destinationCity: true, destinationState: true,
          pickupDate: true,
        },
      });

      if (load?.carrier?.mcNumber) {
        const [eld, mileage] = await Promise.allSettled([
          getTruckstopEldPosition(load.carrier.mcNumber),
          load.originCity && load.destinationCity
            ? getTruckMileage(
                `${load.originCity}, ${load.originState}`,
                `${load.destinationCity}, ${load.destinationState}`,
              )
            : Promise.resolve({ configured: false, miles: null, fromCache: false }),
        ]);

        if (mileage.status === "fulfilled" && mileage.value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = mileage.value as any;
          const hasError = !!m.error;
          await logIntegration({
            provider: "HERE",
            action: "HEALTH_CHECK",
            status: hasError ? "FAILED" : m.miles ? "SUCCESS" : "SKIPPED",
            message: m.miles ? `HERE mileage for load: ${m.miles} (cached: ${m.fromCache})` : "No HERE mileage",
            error: hasError ? m.error : null,
          });
        }

        if (eld.status === "fulfilled" && eld.value.found) {
          enrichment.eldPosition = {
            lat: eld.value.lat,
            lng: eld.value.lng,
            lastUpdatedAt: eld.value.lastUpdatedAt,
            speedMph: eld.value.speedMph,
          };
          dataAvailability.eldPosition = true;
        } else {
          dataAvailability.eldPosition = eld.status === "fulfilled" && eld.value.configured ? "carrier_not_connected" : "not_configured";
        }

        if (mileage.status === "fulfilled" && mileage.value.miles && load.pickupDate) {
          const hoursElapsed = (Date.now() - load.pickupDate.getTime()) / 3600000;
          const avgSpeed = 50; // mph typical average for OTR
          const estimatedMilesCompleted = Math.min(hoursElapsed * avgSpeed, mileage.value.miles);
          enrichment.estimatedProgress = {
            totalMiles: mileage.value.miles,
            estimatedMilesCompleted: Math.round(estimatedMilesCompleted),
            estimatedPercentComplete: Math.round((estimatedMilesCompleted / mileage.value.miles) * 100),
          };
          dataAvailability.mileageEstimate = true;
        }
      }
    } catch {
      dataAvailability.eldPosition = "failed";
    }
  }

  return { base, enrichment, dataAvailability };
}

// ─── Billing Readiness Agent ───────────────────────────────────────────────

async function enrichBillingReadiness(
  loadId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  if (!hasDatabaseUrl() || !prisma) {
    return { base, enrichment, dataAvailability };
  }

  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        deliveryDate: true,
        carrierInvoice: true,
      },
    });

    if (load) {
      const now = new Date();

      if (load.deliveryDate) {
        const daysSinceDelivery = Math.floor(
          (now.getTime() - load.deliveryDate.getTime()) / 86400000,
        );
        enrichment.daysSinceDelivery = daysSinceDelivery;
      }

      const carrierInvoice = load.carrierInvoice;
      if (carrierInvoice) {
        const daysOutstanding = carrierInvoice.dueDate
          ? Math.floor((now.getTime() - carrierInvoice.dueDate.getTime()) / 86400000)
          : null;
        const agingBucket =
          daysOutstanding === null
            ? "unknown"
            : daysOutstanding <= 0
              ? "current"
              : daysOutstanding <= 30
                ? "1-30"
                : daysOutstanding <= 60
                  ? "31-60"
                  : daysOutstanding <= 90
                    ? "61-90"
                    : "90+";

        enrichment.carrierInvoice = {
          invoiceNumber: carrierInvoice.invoiceNumber,
          amount: Number(carrierInvoice.amount),
          agreedRate: carrierInvoice.agreedRate ? Number(carrierInvoice.agreedRate) : null,
          status: carrierInvoice.status,
          dueDate: carrierInvoice.dueDate?.toISOString() ?? null,
          daysOutstanding,
          agingBucket,
        };
        dataAvailability.carrierInvoice = true;
      } else {
        dataAvailability.carrierInvoice = "not_received";
      }

      dataAvailability.deliveryDate = load.deliveryDate ? true : "not_set";
    }
  } catch {
    dataAvailability.billingEnrichment = "failed";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Carrier Compliance Agent ──────────────────────────────────────────────

async function enrichCarrierCompliance(
  carrierId: string,
  base: unknown,
): Promise<EnrichedAgentContext> {
  const enrichment: Record<string, unknown> = {};
  const dataAvailability: Record<string, boolean | string> = {};

  const ctx = base as Record<string, unknown>;
  const mcNumber = ctx.mcNumber as string | null;
  const dotNumber = ctx.dotNumber as string | null;
  const phone = ctx.phone as string | null;
  const company = ctx.company as string | null;

  // Check cache on the carrier record
  let useCached = false;
  if (hasDatabaseUrl() && prisma) {
    try {
      const carrier = await prisma.carrier.findUnique({
        where: { id: carrierId },
        select: { fmcsaSnapshot: true, fmcsaSnapshotAt: true },
      });
      if (carrier?.fmcsaSnapshotAt) {
        const ageDays = (Date.now() - carrier.fmcsaSnapshotAt.getTime()) / 86400000;
        if (ageDays < 30 && carrier.fmcsaSnapshot) {
          enrichment.fmcsaData = carrier.fmcsaSnapshot;
          dataAvailability.fmcsa = "cached";
          useCached = true;
        }
      }
    } catch {
      // proceed to live fetch
    }
  }

  if (!useCached) {
    const fmcsaResult = await (
      dotNumber
        ? lookupCarrierByDot(dotNumber)
        : mcNumber
          ? lookupCarrierByMc(mcNumber)
          : Promise.resolve({ configured: false, found: false as const })
    );

    const fmcsaHasError = "error" in fmcsaResult && !!fmcsaResult.error;
    await logIntegration({
      provider: "FMCSA",
      action: "CARRIER_RESPONSE_SYNC",
      status: fmcsaHasError ? "FAILED" : fmcsaResult.found ? "SUCCESS" : "SKIPPED",
      message: fmcsaResult.found ? `FMCSA data for ${fmcsaResult.dotNumber || fmcsaResult.mcNumber || ""}` : "No FMCSA match or not configured",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: fmcsaHasError ? (fmcsaResult as any).error : null,
    });

    if (fmcsaResult.configured && fmcsaResult.found) {
      const snapshot = strip(fmcsaResult);
      enrichment.fmcsaData = snapshot;
      dataAvailability.fmcsa = "live";

      // Write back to carrier record as side effect
      if (hasDatabaseUrl() && prisma) {
        prisma.carrier
          .update({
            where: { id: carrierId },
            data: {
              fmcsaSnapshot: fmcsaResult.raw as Prisma.InputJsonValue,
              fmcsaSnapshotAt: new Date(),
            },
          })
          .catch(() => {/* non-fatal */});
      }
    } else {
      dataAvailability.fmcsa = fmcsaResult.configured ? "not_found" : "not_configured";
    }
  }

  // CarrierOk risk profile with fraud signals
  const carrierOkResult = await getCarrierRiskProfile(mcNumber, dotNumber, {
    providedPhone: phone,
    providedName: company,
  });
  if (carrierOkResult.found) {
    enrichment.carrierOkProfile = strip(carrierOkResult);
    enrichment.fraudSignals = carrierOkResult.fraudSignals;
    dataAvailability.carrierOk = true;
  } else {
    dataAvailability.carrierOk = carrierOkResult.configured ? "not_found" : "not_configured";
    // Still include fraud signals even without full profile (authority age check etc.)
    enrichment.fraudSignals = carrierOkResult.fraudSignals;
  }

  // Truckstop carrier risk
  if (mcNumber) {
    const tsRisk = await getTruckstopCarrierRisk(mcNumber);
    if (tsRisk.found) {
      enrichment.truckstopRisk = strip(tsRisk);
      dataAvailability.truckstopRisk = true;
    } else {
      dataAvailability.truckstopRisk = tsRisk.configured ? "not_found" : "not_configured";
    }
  }

  // Internal load history
  if (hasDatabaseUrl() && prisma) {
    try {
      const history = await getCarrierHistory(carrierId);
      if (history) {
        enrichment.loadHistory = history;
        dataAvailability.loadHistory = true;
      }
    } catch {
      dataAvailability.loadHistory = "failed";
    }
  }

  // New carrier flag + callback reminder
  const isNew = !enrichment.loadHistory ||
    (enrichment.loadHistory as Record<string, unknown>).totalLoads === 0;
  enrichment.isNewCarrier = isNew;
  if (isNew) {
    enrichment.callbackRequired =
      "NEW CARRIER: Call the phone number on the FMCSA record to verify identity before tendering any load.";
  }

  return { base, enrichment, dataAvailability };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getCarrierHistory(carrierId: string) {
  if (!hasDatabaseUrl() || !prisma) return null;
  const loads = await prisma.load.findMany({
    where: { carrierId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      status: true,
      carrierRate: true,
      equipmentType: true,
      updatedAt: true,
      events: { where: { type: "DELAY" }, take: 1 },
    },
  });
  if (!loads.length) return { totalLoads: 0 };
  const delivered = loads.filter((l) => l.status === "DELIVERED").length;
  const incidents = loads.filter((l) => l.events.length > 0).length;
  return {
    totalLoads: loads.length,
    deliveredLoads: delivered,
    incidentCount: incidents,
    onTimePercent: delivered > 0 ? Math.round(((delivered - incidents) / delivered) * 100) : null,
    lastUsedAt: loads[0].updatedAt.toISOString(),
  };
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function strip<T extends object>(obj: T): Omit<T, "raw"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { raw: _raw, ...rest } = obj as T & { raw?: unknown };
  return rest as Omit<T, "raw">;
}
