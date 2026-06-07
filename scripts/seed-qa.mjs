import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed local QA data.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const ids = {
  austin: "qa-user-austin",
  conner: "qa-user-conner",
  devon: "qa-user-devon",
  michael: "qa-user-michael",
  shipper: "qa-shipper-apex",
  contact: "qa-contact-jordan",
  customerAccount: "qa-customer-account-jordan",
  lead: "qa-lead-apex",
  quotePrimary: "qa-quote-atl-nash",
  quoteReefer: "qa-quote-sav-clt",
  customerQuote: "qa-customer-quote-atl-nash",
  datBenchmark: "qa-rate-benchmark-dat",
  truckstopBenchmark: "qa-rate-benchmark-truckstop",
  recommendation: "qa-pricing-recommendation-atl-nash",
  carrierApproved: "qa-carrier-approved",
  carrierBlocked: "qa-carrier-blocked",
  loadActive: "qa-load-active",
  loadCompleted: "qa-load-completed",
  activeCarrierQuote: "qa-carrier-quote-active",
  blockedCarrierQuote: "qa-carrier-quote-blocked",
  candidateApproved: "qa-candidate-approved",
  candidateBlocked: "qa-candidate-blocked",
  activeException: "qa-load-exception-active",
  activeBol: "qa-doc-active-bol",
  activeRateConfirmation: "qa-doc-active-rate-confirmation",
  completedPod: "qa-doc-completed-pod",
  completedInvoiceDoc: "qa-doc-completed-invoice",
  invoice: "qa-invoice-completed",
  carrierInvoice: "qa-carrier-invoice-completed",
  activeTrackingLink: "qa-public-tracking-active",
  aiRun: "qa-ai-run-quote-approval",
  call: "qa-call-inbound",
  callActivity: "qa-activity-call",
  followupActivity: "qa-activity-followup",
  commissionPlan: "qa-commission-standard",
  auditLog: "qa-audit-seed",
  callDisclosureSetting: "qa-setting-call-recording-disclosure",
};

function daysFromNow(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function main() {
  const [austin, conner, devon, michael] = await Promise.all([
    prisma.user.upsert({
      where: { id: ids.austin },
      update: {
        name: "Austin",
        email: "austin@dao-logistics.local",
        role: "OWNER",
      },
      create: {
        id: ids.austin,
        name: "Austin",
        email: "austin@dao-logistics.local",
        role: "OWNER",
      },
    }),
    prisma.user.upsert({
      where: { id: ids.conner },
      update: {
        name: "Conner",
        email: "conner@dao-logistics.local",
        role: "OWNER",
      },
      create: {
        id: ids.conner,
        name: "Conner",
        email: "conner@dao-logistics.local",
        role: "OWNER",
      },
    }),
    prisma.user.upsert({
      where: { id: ids.devon },
      update: {
        name: "Devon",
        email: "devon@dao-logistics.local",
        role: "OPS",
      },
      create: {
        id: ids.devon,
        name: "Devon",
        email: "devon@dao-logistics.local",
        role: "OPS",
      },
    }),
    prisma.user.upsert({
      where: { id: ids.michael },
      update: {
        name: "Michael",
        email: "michael@dao-logistics.local",
        role: "SALES",
      },
      create: {
        id: ids.michael,
        name: "Michael",
        email: "michael@dao-logistics.local",
        role: "SALES",
      },
    }),
  ]);

  await prisma.commissionPlan.upsert({
    where: { id: ids.commissionPlan },
    update: {
      active: true,
      managingUserPercent: "35.00",
      customerOwnerPercent: "15.00",
      houseOwnerPercent: "20.00",
      companyPercent: "30.00",
      houseOwnerUserId: austin.id,
      notes:
        "QA standard split: manager 35%, lifetime client owner 15%, Austin 20%, company 30%.",
    },
    create: {
      id: ids.commissionPlan,
      name: "QA standard gross profit split",
      active: true,
      managingUserPercent: "35.00",
      customerOwnerPercent: "15.00",
      houseOwnerPercent: "20.00",
      companyPercent: "30.00",
      houseOwnerUserId: austin.id,
      notes:
        "QA standard split: manager 35%, lifetime client owner 15%, Austin 20%, company 30%.",
    },
  });

  const shipper = await prisma.shipper.upsert({
    where: { id: ids.shipper },
    update: {
      companyName: "QA Apex Manufacturing",
      status: "ACTIVE",
      source: "OUTBOUND",
      acquisitionOwnerUserId: michael.id,
      creditTerms: "Net 30",
      creditLimit: "75000.00",
      portalEnabled: true,
      notes:
        "QA account for end-to-end testing. Michael owns lifetime client conversion.",
    },
    create: {
      id: ids.shipper,
      companyName: "QA Apex Manufacturing",
      website: "https://qa-apex.example",
      industry: "Building materials",
      status: "ACTIVE",
      source: "OUTBOUND",
      acquisitionOwnerUserId: michael.id,
      creditTerms: "Net 30",
      creditLimit: "75000.00",
      portalEnabled: true,
      notes:
        "QA account for end-to-end testing. Michael owns lifetime client conversion.",
    },
  });

  const contact = await prisma.contact.upsert({
    where: { id: ids.contact },
    update: {
      shipperId: shipper.id,
      firstName: "Jordan",
      lastName: "Reed",
      title: "Logistics Manager",
      email: "jordan.reed@qa-apex.example",
      phone: "+14045550122",
      isPrimary: true,
    },
    create: {
      id: ids.contact,
      shipperId: shipper.id,
      firstName: "Jordan",
      lastName: "Reed",
      title: "Logistics Manager",
      email: "jordan.reed@qa-apex.example",
      phone: "+14045550122",
      isPrimary: true,
    },
  });

  await prisma.customerAccount.upsert({
    where: { id: ids.customerAccount },
    update: {
      email: "jordan.reed@qa-apex.example",
      shipperId: shipper.id,
      enabled: true,
    },
    create: {
      id: ids.customerAccount,
      email: "jordan.reed@qa-apex.example",
      shipperId: shipper.id,
      enabled: true,
    },
  });

  const lead = await prisma.lead.upsert({
    where: { id: ids.lead },
    update: {
      shipperId: shipper.id,
      contactId: contact.id,
      ownerUserId: michael.id,
      stage: "QUALIFIED",
      source: "OUTBOUND",
      priority: 1,
      nextFollowUpAt: daysFromNow(1),
      estimatedMonthlySpend: "45000.00",
      notes: "QA lead converted into active shipper. Follow-up should be visible.",
    },
    create: {
      id: ids.lead,
      shipperId: shipper.id,
      contactId: contact.id,
      ownerUserId: michael.id,
      stage: "QUALIFIED",
      source: "OUTBOUND",
      priority: 1,
      nextFollowUpAt: daysFromNow(1),
      estimatedMonthlySpend: "45000.00",
      notes: "QA lead converted into active shipper. Follow-up should be visible.",
    },
  });

  await prisma.activity.upsert({
    where: { id: ids.followupActivity },
    update: {
      leadId: lead.id,
      shipperId: shipper.id,
      contactId: contact.id,
      userId: michael.id,
      type: "CALL",
      direction: "OUTBOUND",
      subject: "QA conversion call",
      body: "Customer confirmed recurring Atlanta to Nashville dry van freight.",
      outcome: "Customer agreed to send first load details.",
    },
    create: {
      id: ids.followupActivity,
      leadId: lead.id,
      shipperId: shipper.id,
      contactId: contact.id,
      userId: michael.id,
      type: "CALL",
      direction: "OUTBOUND",
      subject: "QA conversion call",
      body: "Customer confirmed recurring Atlanta to Nashville dry van freight.",
      outcome: "Customer agreed to send first load details.",
    },
  });

  const quotePrimary = await prisma.quoteRequest.upsert({
    where: { id: ids.quotePrimary },
    update: {
      shipperId: shipper.id,
      contactId: contact.id,
      originCity: "Atlanta",
      originState: "GA",
      destinationCity: "Nashville",
      destinationState: "TN",
      pickupDate: daysFromNow(1),
      pickupWindow: "0800-1200",
      deliveryDate: daysFromNow(2),
      deliveryWindow: "By appointment",
      equipmentType: "Dry Van",
      commodity: "Palletized building materials",
      weight: 42000,
      palletCount: 24,
      appointmentRequired: true,
      targetMarginPercent: "26.00",
      pricingNotes:
        "QA quote: compare manual DAT and Truckstop benchmarks before quoting.",
      status: "QUOTED",
    },
    create: {
      id: ids.quotePrimary,
      shipperId: shipper.id,
      contactId: contact.id,
      originCity: "Atlanta",
      originState: "GA",
      destinationCity: "Nashville",
      destinationState: "TN",
      pickupDate: daysFromNow(1),
      pickupWindow: "0800-1200",
      deliveryDate: daysFromNow(2),
      deliveryWindow: "By appointment",
      equipmentType: "Dry Van",
      commodity: "Palletized building materials",
      weight: 42000,
      palletCount: 24,
      appointmentRequired: true,
      customerReference: "QA-ATL-NSH-001",
      targetMarginPercent: "26.00",
      pricingNotes:
        "QA quote: compare manual DAT and Truckstop benchmarks before quoting.",
      status: "QUOTED",
    },
  });

  await prisma.quoteRequest.upsert({
    where: { id: ids.quoteReefer },
    update: {
      shipperId: shipper.id,
      contactId: contact.id,
      originCity: "Savannah",
      originState: "GA",
      destinationCity: "Charlotte",
      destinationState: "NC",
      pickupDate: daysFromNow(3),
      deliveryDate: daysFromNow(4),
      equipmentType: "Reefer",
      commodity: "Temperature-sensitive packaging",
      weight: 18000,
      temperatureRequirement: "34-38F",
      urgency: "This week",
      status: "PRICING",
      pricingNotes: "QA secondary quote still needs live DAT/Truckstop pricing.",
    },
    create: {
      id: ids.quoteReefer,
      shipperId: shipper.id,
      contactId: contact.id,
      originCity: "Savannah",
      originState: "GA",
      destinationCity: "Charlotte",
      destinationState: "NC",
      pickupDate: daysFromNow(3),
      deliveryDate: daysFromNow(4),
      equipmentType: "Reefer",
      commodity: "Temperature-sensitive packaging",
      weight: 18000,
      temperatureRequirement: "34-38F",
      urgency: "This week",
      status: "PRICING",
      pricingNotes: "QA secondary quote still needs live DAT/Truckstop pricing.",
    },
  });

  await prisma.rateBenchmark.upsert({
    where: { id: ids.datBenchmark },
    update: {
      quoteRequestId: quotePrimary.id,
      source: "DAT",
      sourceLabel: "QA DAT spot benchmark",
      lowRate: "1725.00",
      highRate: "1875.00",
      averageRate: "1800.00",
      confidence: "76.00",
      notes: "Manual QA placeholder until account-specific DAT mapping is live.",
    },
    create: {
      id: ids.datBenchmark,
      quoteRequestId: quotePrimary.id,
      source: "DAT",
      sourceLabel: "QA DAT spot benchmark",
      lowRate: "1725.00",
      highRate: "1875.00",
      averageRate: "1800.00",
      confidence: "76.00",
      notes: "Manual QA placeholder until account-specific DAT mapping is live.",
    },
  });

  await prisma.rateBenchmark.upsert({
    where: { id: ids.truckstopBenchmark },
    update: {
      quoteRequestId: quotePrimary.id,
      source: "TRUCKSTOP",
      sourceLabel: "QA Truckstop capacity benchmark",
      lowRate: "1760.00",
      highRate: "1910.00",
      averageRate: "1840.00",
      confidence: "72.00",
      notes:
        "Manual QA placeholder until account-specific Truckstop mapping is live.",
    },
    create: {
      id: ids.truckstopBenchmark,
      quoteRequestId: quotePrimary.id,
      source: "TRUCKSTOP",
      sourceLabel: "QA Truckstop capacity benchmark",
      lowRate: "1760.00",
      highRate: "1910.00",
      averageRate: "1840.00",
      confidence: "72.00",
      notes:
        "Manual QA placeholder until account-specific Truckstop mapping is live.",
    },
  });

  await prisma.pricingRecommendation.upsert({
    where: { id: ids.recommendation },
    update: {
      quoteRequestId: quotePrimary.id,
      source: "SYSTEM",
      recommendedCarrierCost: "1820.00",
      recommendedCustomerRate: "2450.00",
      projectedGrossProfit: "630.00",
      marginPercent: "25.71",
      targetMarginPercent: "26.00",
      riskLevel: "Medium",
      validForHours: 24,
      summary: "QA recommendation based on DAT/Truckstop manual benchmarks.",
      notes: "Use this to test pricing recommendation review and quote email.",
    },
    create: {
      id: ids.recommendation,
      quoteRequestId: quotePrimary.id,
      source: "SYSTEM",
      recommendedCarrierCost: "1820.00",
      recommendedCustomerRate: "2450.00",
      projectedGrossProfit: "630.00",
      marginPercent: "25.71",
      targetMarginPercent: "26.00",
      riskLevel: "Medium",
      validForHours: 24,
      summary: "QA recommendation based on DAT/Truckstop manual benchmarks.",
      notes: "Use this to test pricing recommendation review and quote email.",
    },
  });

  await prisma.customerQuote.upsert({
    where: { id: ids.customerQuote },
    update: {
      quoteRequestId: quotePrimary.id,
      quotedRate: "2450.00",
      targetCarrierCost: "1820.00",
      projectedGrossProfit: "630.00",
      marginPercent: "25.71",
      status: "SENT",
      validUntil: daysFromNow(1),
      createdByUserId: michael.id,
    },
    create: {
      id: ids.customerQuote,
      quoteRequestId: quotePrimary.id,
      quotedRate: "2450.00",
      targetCarrierCost: "1820.00",
      projectedGrossProfit: "630.00",
      marginPercent: "25.71",
      status: "SENT",
      validUntil: daysFromNow(1),
      createdByUserId: michael.id,
    },
  });

  const [approvedCarrier, blockedCarrier] = await Promise.all([
    prisma.carrier.upsert({
      where: { id: ids.carrierApproved },
      update: {
        companyName: "QA Reliable Trucking",
        mcNumber: "QA123456",
        dotNumber: "QA987654",
        contactName: "Dana Dispatch",
        phone: "+16155550188",
        email: "dispatch@qa-reliable.example",
        complianceStatus: "APPROVED",
        authorityStatus: "Active",
        insuranceStatus: "Valid",
        safetyRating: "Satisfactory",
        fraudRiskLevel: "Low",
        lastVettedAt: daysFromNow(-1),
        approvedBy: "Devon",
        insuranceExpiration: daysFromNow(60),
        callbackVerifiedAt: daysFromNow(-1),
        preferredLanes: ["GA -> TN", "GA -> NC"],
        notes: "QA approved carrier for booking and tracking tests.",
        blockedReason: null,
      },
      create: {
        id: ids.carrierApproved,
        companyName: "QA Reliable Trucking",
        mcNumber: "QA123456",
        dotNumber: "QA987654",
        contactName: "Dana Dispatch",
        phone: "+16155550188",
        email: "dispatch@qa-reliable.example",
        complianceStatus: "APPROVED",
        authorityStatus: "Active",
        insuranceStatus: "Valid",
        safetyRating: "Satisfactory",
        fraudRiskLevel: "Low",
        lastVettedAt: daysFromNow(-1),
        approvedBy: "Devon",
        insuranceExpiration: daysFromNow(60),
        callbackVerifiedAt: daysFromNow(-1),
        preferredLanes: ["GA -> TN", "GA -> NC"],
        notes: "QA approved carrier for booking and tracking tests.",
      },
    }),
    prisma.carrier.upsert({
      where: { id: ids.carrierBlocked },
      update: {
        companyName: "QA Blocked Carrier",
        mcNumber: "QA000111",
        dotNumber: "QA000222",
        contactName: "Blocked Dispatch",
        phone: "+16155550199",
        email: "dispatch@qa-blocked.example",
        complianceStatus: "REJECTED",
        authorityStatus: "Inactive",
        insuranceStatus: "Expired",
        safetyRating: "Conditional",
        fraudRiskLevel: "High",
        blockedReason: "QA blocked carrier should fail booking gate.",
        notes: "Use this carrier to verify hard compliance booking block.",
      },
      create: {
        id: ids.carrierBlocked,
        companyName: "QA Blocked Carrier",
        mcNumber: "QA000111",
        dotNumber: "QA000222",
        contactName: "Blocked Dispatch",
        phone: "+16155550199",
        email: "dispatch@qa-blocked.example",
        complianceStatus: "REJECTED",
        authorityStatus: "Inactive",
        insuranceStatus: "Expired",
        safetyRating: "Conditional",
        fraudRiskLevel: "High",
        blockedReason: "QA blocked carrier should fail booking gate.",
        notes: "Use this carrier to verify hard compliance booking block.",
      },
    }),
  ]);

  const activeLoad = await prisma.load.upsert({
    where: { id: ids.loadActive },
    update: {
      quoteRequestId: quotePrimary.id,
      shipperId: shipper.id,
      managingUserId: devon.id,
      customerOwnerUserId: michael.id,
      carrierId: approvedCarrier.id,
      status: "IN_TRANSIT",
      originCity: "Atlanta",
      originState: "GA",
      destinationCity: "Nashville",
      destinationState: "TN",
      equipmentType: "Dry Van",
      commodity: "Palletized building materials",
      weight: 42000,
      palletCount: 24,
      appointmentRequired: true,
      customerReference: "QA-LOAD-ACTIVE",
      pickupWindow: "0800-1200",
      deliveryWindow: "By appointment",
      customerRate: "2450.00",
      carrierRate: "1800.00",
      grossProfit: "650.00",
      pickupDate: daysFromNow(-1),
      deliveryDate: daysFromNow(1),
      customerUpdateStatus: "NEEDED",
      rateConfirmationStatus: "SIGNED",
      rateConfirmationSentAt: daysFromNow(-2),
      rateConfirmationSignedAt: daysFromNow(-2),
    },
    create: {
      id: ids.loadActive,
      quoteRequestId: quotePrimary.id,
      shipperId: shipper.id,
      managingUserId: devon.id,
      customerOwnerUserId: michael.id,
      carrierId: approvedCarrier.id,
      status: "IN_TRANSIT",
      originCity: "Atlanta",
      originState: "GA",
      destinationCity: "Nashville",
      destinationState: "TN",
      equipmentType: "Dry Van",
      commodity: "Palletized building materials",
      weight: 42000,
      palletCount: 24,
      appointmentRequired: true,
      customerReference: "QA-LOAD-ACTIVE",
      pickupWindow: "0800-1200",
      deliveryWindow: "By appointment",
      customerRate: "2450.00",
      carrierRate: "1800.00",
      grossProfit: "650.00",
      pickupDate: daysFromNow(-1),
      deliveryDate: daysFromNow(1),
      customerUpdateStatus: "NEEDED",
      rateConfirmationStatus: "SIGNED",
      rateConfirmationSentAt: daysFromNow(-2),
      rateConfirmationSignedAt: daysFromNow(-2),
    },
  });

  const completedLoad = await prisma.load.upsert({
    where: { id: ids.loadCompleted },
    update: {
      shipperId: shipper.id,
      managingUserId: devon.id,
      customerOwnerUserId: michael.id,
      carrierId: approvedCarrier.id,
      status: "PAID",
      originCity: "Marietta",
      originState: "GA",
      destinationCity: "Birmingham",
      destinationState: "AL",
      equipmentType: "Dry Van",
      commodity: "Finished goods",
      customerReference: "QA-LOAD-PAID",
      customerRate: "1850.00",
      carrierRate: "1300.00",
      grossProfit: "550.00",
      pickupDate: daysFromNow(-12),
      deliveryDate: daysFromNow(-10),
      customerUpdateStatus: "SENT",
      lastCustomerUpdateAt: daysFromNow(-10),
      rateConfirmationStatus: "SIGNED",
      rateConfirmationSentAt: daysFromNow(-13),
      rateConfirmationSignedAt: daysFromNow(-13),
    },
    create: {
      id: ids.loadCompleted,
      shipperId: shipper.id,
      managingUserId: devon.id,
      customerOwnerUserId: michael.id,
      carrierId: approvedCarrier.id,
      status: "PAID",
      originCity: "Marietta",
      originState: "GA",
      destinationCity: "Birmingham",
      destinationState: "AL",
      equipmentType: "Dry Van",
      commodity: "Finished goods",
      customerReference: "QA-LOAD-PAID",
      customerRate: "1850.00",
      carrierRate: "1300.00",
      grossProfit: "550.00",
      pickupDate: daysFromNow(-12),
      deliveryDate: daysFromNow(-10),
      customerUpdateStatus: "SENT",
      lastCustomerUpdateAt: daysFromNow(-10),
      rateConfirmationStatus: "SIGNED",
      rateConfirmationSentAt: daysFromNow(-13),
      rateConfirmationSignedAt: daysFromNow(-13),
    },
  });

  await Promise.all([
    prisma.carrierQuote.upsert({
      where: { id: ids.activeCarrierQuote },
      update: {
        loadId: activeLoad.id,
        carrierId: approvedCarrier.id,
        quotedRate: "1800.00",
        status: "ACCEPTED",
        notes: "Accepted QA carrier quote.",
      },
      create: {
        id: ids.activeCarrierQuote,
        loadId: activeLoad.id,
        carrierId: approvedCarrier.id,
        quotedRate: "1800.00",
        status: "ACCEPTED",
        notes: "Accepted QA carrier quote.",
      },
    }),
    prisma.carrierQuote.upsert({
      where: { id: ids.blockedCarrierQuote },
      update: {
        loadId: activeLoad.id,
        carrierId: blockedCarrier.id,
        quotedRate: "1550.00",
        status: "RECEIVED",
        notes: "Use to verify blocked carrier cannot be accepted.",
      },
      create: {
        id: ids.blockedCarrierQuote,
        loadId: activeLoad.id,
        carrierId: blockedCarrier.id,
        quotedRate: "1550.00",
        status: "RECEIVED",
        notes: "Use to verify blocked carrier cannot be accepted.",
      },
    }),
    prisma.carrierSourcingCandidate.upsert({
      where: { id: ids.candidateApproved },
      update: {
        loadId: activeLoad.id,
        carrierId: approvedCarrier.id,
        source: "MANUAL",
        status: "CONVERTED",
        companyName: approvedCarrier.companyName,
        contactName: "Dana Dispatch",
        phone: "+16155550188",
        email: "dispatch@qa-reliable.example",
        suggestedRate: "1800.00",
        matchScore: "92.00",
        complianceSnapshot: "Approved QA carrier.",
      },
      create: {
        id: ids.candidateApproved,
        loadId: activeLoad.id,
        carrierId: approvedCarrier.id,
        source: "MANUAL",
        status: "CONVERTED",
        companyName: approvedCarrier.companyName,
        contactName: "Dana Dispatch",
        phone: "+16155550188",
        email: "dispatch@qa-reliable.example",
        suggestedRate: "1800.00",
        matchScore: "92.00",
        complianceSnapshot: "Approved QA carrier.",
      },
    }),
    prisma.carrierSourcingCandidate.upsert({
      where: { id: ids.candidateBlocked },
      update: {
        loadId: activeLoad.id,
        carrierId: blockedCarrier.id,
        source: "MANUAL",
        status: "REJECTED",
        companyName: blockedCarrier.companyName,
        contactName: "Blocked Dispatch",
        phone: "+16155550199",
        email: "dispatch@qa-blocked.example",
        suggestedRate: "1550.00",
        matchScore: "35.00",
        complianceSnapshot: "Blocked QA carrier.",
      },
      create: {
        id: ids.candidateBlocked,
        loadId: activeLoad.id,
        carrierId: blockedCarrier.id,
        source: "MANUAL",
        status: "REJECTED",
        companyName: blockedCarrier.companyName,
        contactName: "Blocked Dispatch",
        phone: "+16155550199",
        email: "dispatch@qa-blocked.example",
        suggestedRate: "1550.00",
        matchScore: "35.00",
        complianceSnapshot: "Blocked QA carrier.",
      },
    }),
  ]);

  await Promise.all([
    prisma.shipmentEvent.upsert({
      where: { id: "qa-event-pickup" },
      update: {
        loadId: activeLoad.id,
        type: "PICKUP_CONFIRMED",
        message: "QA pickup confirmed by carrier.",
        location: "Atlanta, GA",
        occurredAt: daysFromNow(-1),
      },
      create: {
        id: "qa-event-pickup",
        loadId: activeLoad.id,
        type: "PICKUP_CONFIRMED",
        message: "QA pickup confirmed by carrier.",
        location: "Atlanta, GA",
        occurredAt: daysFromNow(-1),
      },
    }),
    prisma.shipmentEvent.upsert({
      where: { id: "qa-event-location" },
      update: {
        loadId: activeLoad.id,
        type: "LOCATION_UPDATE",
        message: "QA check call: driver 65 miles from Nashville.",
        location: "Murfreesboro, TN",
        occurredAt: daysFromNow(0),
      },
      create: {
        id: "qa-event-location",
        loadId: activeLoad.id,
        type: "LOCATION_UPDATE",
        message: "QA check call: driver 65 miles from Nashville.",
        location: "Murfreesboro, TN",
        occurredAt: daysFromNow(0),
      },
    }),
    prisma.loadException.upsert({
      where: { id: ids.activeException },
      update: {
        loadId: activeLoad.id,
        type: "CUSTOMER_UPDATE_DUE",
        status: "ASSIGNED",
        ownerUserId: devon.id,
        notes:
          "QA exception: customer update is due before delivery appointment.",
        resolvedAt: null,
      },
      create: {
        id: ids.activeException,
        loadId: activeLoad.id,
        type: "CUSTOMER_UPDATE_DUE",
        status: "ASSIGNED",
        ownerUserId: devon.id,
        notes:
          "QA exception: customer update is due before delivery appointment.",
      },
    }),
    prisma.publicTrackingLink.upsert({
      where: { id: ids.activeTrackingLink },
      update: {
        loadId: activeLoad.id,
        token: "qa-public-tracking-active",
        expiresAt: daysFromNow(14),
        revoked: false,
      },
      create: {
        id: ids.activeTrackingLink,
        loadId: activeLoad.id,
        token: "qa-public-tracking-active",
        expiresAt: daysFromNow(14),
        revoked: false,
      },
    }),
  ]);

  await Promise.all([
    upsertDocument(ids.activeBol, {
      loadId: activeLoad.id,
      shipperId: shipper.id,
      carrierId: approvedCarrier.id,
      quoteRequestId: quotePrimary.id,
      uploadedByUserId: devon.id,
      type: "BOL",
      fileName: "qa-active-bol.txt",
      fileUrl: "pending-storage://qa-active-bol.txt",
      extractedText:
        "QA BOL. Atlanta GA to Nashville TN. 24 pallets. 42000 pounds.",
      extractionStatus: "COMPLETED",
      extractedFields: {
        originCity: "Atlanta",
        destinationCity: "Nashville",
        pallets: 24,
        weight: 42000,
      },
    }),
    upsertDocument(ids.activeRateConfirmation, {
      loadId: activeLoad.id,
      shipperId: shipper.id,
      carrierId: approvedCarrier.id,
      uploadedByUserId: devon.id,
      type: "RATE_CONFIRMATION",
      source: "SYSTEM_GENERATED",
      fileName: "qa-active-rate-confirmation.txt",
      fileUrl: "pending-storage://qa-active-rate-confirmation.txt",
      extractedText: "QA rate confirmation signed at carrier rate 1800.",
      extractionStatus: "COMPLETED",
    }),
    upsertDocument(ids.completedPod, {
      loadId: completedLoad.id,
      shipperId: shipper.id,
      carrierId: approvedCarrier.id,
      uploadedByUserId: devon.id,
      type: "POD",
      fileName: "qa-completed-pod.txt",
      fileUrl: "pending-storage://qa-completed-pod.txt",
      extractedText: "QA POD delivered clean in Birmingham AL.",
      extractionStatus: "COMPLETED",
    }),
    upsertDocument(ids.completedInvoiceDoc, {
      loadId: completedLoad.id,
      shipperId: shipper.id,
      uploadedByUserId: devon.id,
      type: "INVOICE",
      source: "SYSTEM_GENERATED",
      fileName: "qa-completed-invoice.txt",
      fileUrl: "pending-storage://qa-completed-invoice.txt",
      extractedText: "QA customer invoice 1850 paid.",
      extractionStatus: "COMPLETED",
    }),
  ]);

  await prisma.invoice.upsert({
    where: { id: ids.invoice },
    update: {
      loadId: completedLoad.id,
      shipperId: shipper.id,
      invoiceNumber: "QA-INV-0001",
      amount: "1850.00",
      balance: "0.00",
      status: "PAID",
      terms: "Net 30",
      sentAt: daysFromNow(-9),
      dueDate: daysFromNow(21),
      paidAt: daysFromNow(-2),
    },
    create: {
      id: ids.invoice,
      loadId: completedLoad.id,
      shipperId: shipper.id,
      invoiceNumber: "QA-INV-0001",
      amount: "1850.00",
      balance: "0.00",
      status: "PAID",
      terms: "Net 30",
      sentAt: daysFromNow(-9),
      dueDate: daysFromNow(21),
      paidAt: daysFromNow(-2),
    },
  });

  await prisma.carrierInvoice.upsert({
    where: { id: ids.carrierInvoice },
    update: {
      loadId: completedLoad.id,
      carrierId: approvedCarrier.id,
      invoiceNumber: "QA-CARR-0001",
      amount: "1300.00",
      agreedRate: "1300.00",
      status: "PAID",
      paymentMethod: "ACH",
      dueDate: daysFromNow(20),
      approvedAt: daysFromNow(-8),
      approvedByUserId: devon.id,
      paidAt: daysFromNow(-2),
      paidByUserId: austin.id,
      approvalOwner: "Devon",
      paymentBatch: "QA-BATCH-0001",
      remittanceNotes: "QA paid carrier invoice for commission readiness.",
    },
    create: {
      id: ids.carrierInvoice,
      loadId: completedLoad.id,
      carrierId: approvedCarrier.id,
      invoiceNumber: "QA-CARR-0001",
      amount: "1300.00",
      agreedRate: "1300.00",
      status: "PAID",
      paymentMethod: "ACH",
      dueDate: daysFromNow(20),
      approvedAt: daysFromNow(-8),
      approvedByUserId: devon.id,
      paidAt: daysFromNow(-2),
      paidByUserId: austin.id,
      approvalOwner: "Devon",
      paymentBatch: "QA-BATCH-0001",
      remittanceNotes: "QA paid carrier invoice for commission readiness.",
    },
  });

  await prisma.aiAgentRun.upsert({
    where: { id: ids.aiRun },
    update: {
      agentName: "Quote Agent",
      relatedEntityType: "QuoteRequest",
      relatedEntityId: quotePrimary.id,
      status: "NEEDS_HUMAN_APPROVAL",
      outputJson: {
        summary:
          "QA quote recommendation ready. Review DAT/Truckstop benchmarks before sending.",
        nextAction: "Approve quote email draft or adjust margin.",
      },
      confidence: "78.00",
      automationMode: "ASSISTED",
      riskLevel: "Medium",
      approvalRequired: true,
      actionSummary: "Draft customer quote for QA Apex Manufacturing.",
      promptVersion: 1,
    },
    create: {
      id: ids.aiRun,
      agentName: "Quote Agent",
      relatedEntityType: "QuoteRequest",
      relatedEntityId: quotePrimary.id,
      status: "NEEDS_HUMAN_APPROVAL",
      outputJson: {
        summary:
          "QA quote recommendation ready. Review DAT/Truckstop benchmarks before sending.",
        nextAction: "Approve quote email draft or adjust margin.",
      },
      confidence: "78.00",
      automationMode: "ASSISTED",
      riskLevel: "Medium",
      approvalRequired: true,
      actionSummary: "Draft customer quote for QA Apex Manufacturing.",
      promptVersion: 1,
    },
  });

  await prisma.brokerageCall.upsert({
    where: { id: ids.call },
    update: {
      direction: "INBOUND",
      status: "COMPLETED",
      twilioCallSid: "QA-CALL-SID-0001",
      fromPhone: "+14045550122",
      toPhone: "+14045550100",
      callerName: "Jordan Reed",
      shipperId: shipper.id,
      contactId: contact.id,
      quoteRequestId: quotePrimary.id,
      recordingStatus: "COMPLETED",
      transcriptText:
        "Need Atlanta to Nashville dry van picked up tomorrow, 24 pallets, 42000 pounds, appointment delivery.",
      transcriptStatus: "COMPLETED",
      aiSummary: "QA inbound load call captured quote details.",
      extractionStatus: "NEEDS_REVIEW",
    },
    create: {
      id: ids.call,
      direction: "INBOUND",
      status: "COMPLETED",
      twilioCallSid: "QA-CALL-SID-0001",
      fromPhone: "+14045550122",
      toPhone: "+14045550100",
      callerName: "Jordan Reed",
      shipperId: shipper.id,
      contactId: contact.id,
      quoteRequestId: quotePrimary.id,
      recordingStatus: "COMPLETED",
      transcriptText:
        "Need Atlanta to Nashville dry van picked up tomorrow, 24 pallets, 42000 pounds, appointment delivery.",
      transcriptStatus: "COMPLETED",
      aiSummary: "QA inbound load call captured quote details.",
      extractionStatus: "NEEDS_REVIEW",
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "callRecordingDisclosure" },
    update: {
      value:
        "QA disclosure: this call may be recorded and transcribed to capture shipment details accurately.",
    },
    create: {
      id: ids.callDisclosureSetting,
      key: "callRecordingDisclosure",
      value:
        "QA disclosure: this call may be recorded and transcribed to capture shipment details accurately.",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: ids.auditLog },
    update: {
      action: "QA_SEED_REFRESHED",
      entityType: "LocalQA",
      entityId: "dao_logistics_qa",
      summary: "Local QA seed refreshed.",
      userId: austin.id,
      afterJson: {
        users: [austin.name, conner.name, devon.name, michael.name],
        activeLoadId: activeLoad.id,
        completedLoadId: completedLoad.id,
      },
    },
    create: {
      id: ids.auditLog,
      action: "QA_SEED_REFRESHED",
      entityType: "LocalQA",
      entityId: "dao_logistics_qa",
      summary: "Local QA seed refreshed.",
      userId: austin.id,
      afterJson: {
        users: [austin.name, conner.name, devon.name, michael.name],
        activeLoadId: activeLoad.id,
        completedLoadId: completedLoad.id,
      },
    },
  });

  console.log("Local QA seed complete:");
  console.log(`- Shipper: ${shipper.companyName}`);
  console.log(`- Primary quote: ${quotePrimary.id}`);
  console.log(`- Active load: ${activeLoad.id}`);
  console.log(`- Completed paid load: ${completedLoad.id}`);
  console.log("- Login password: qa-phase-12");
}

async function upsertDocument(id, data) {
  return prisma.document.upsert({
    where: { id },
    update: data,
    create: {
      id,
      ...data,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
