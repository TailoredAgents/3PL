import { prisma } from "@/lib/prisma";

export async function generateInternalCarrierCandidates(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      sourcingCandidates: true,
    },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  const carriers = await prisma.carrier.findMany({
    include: {
      loads: {
        where: {
          carrierRate: { not: null },
        },
        orderBy: { pickupDate: "desc" },
        take: 20,
      },
    },
    orderBy: [{ complianceStatus: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });
  const existingCarrierIds = new Set(
    load.sourcingCandidates
      .map((candidate) => candidate.carrierId)
      .filter((carrierId): carrierId is string => Boolean(carrierId)),
  );
  const existingCompanyNames = new Set(
    load.sourcingCandidates.map((candidate) =>
      candidate.companyName.toLowerCase(),
    ),
  );

  const candidates = carriers
    .filter(
      (carrier) =>
        !existingCarrierIds.has(carrier.id) &&
        !existingCompanyNames.has(carrier.companyName.toLowerCase()),
    )
    .map((carrier) => {
      const matchScore = getCarrierMatchScore(load, carrier);
      const suggestedRate = getSuggestedRate(load, carrier.loads);

      return {
        loadId,
        carrierId: carrier.id,
        source: "INTERNAL_HISTORY" as const,
        status: "NEW" as const,
        companyName: carrier.companyName,
        contactName: carrier.contactName,
        phone: carrier.phone,
        email: carrier.email,
        mcNumber: carrier.mcNumber,
        dotNumber: carrier.dotNumber,
        suggestedRate,
        matchScore,
        complianceSnapshot: [
          `Compliance: ${carrier.complianceStatus}`,
          carrier.authorityStatus ? `Authority: ${carrier.authorityStatus}` : null,
          carrier.insuranceStatus ? `Insurance: ${carrier.insuranceStatus}` : null,
          carrier.safetyRating ? `Safety: ${carrier.safetyRating}` : null,
          carrier.fraudRiskLevel ? `Fraud: ${carrier.fraudRiskLevel}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        notes: buildCandidateNotes(load, carrier),
      };
    })
    .filter((candidate) => candidate.matchScore >= 0.25)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  if (!candidates.length) {
    return { createdCount: 0 };
  }

  const created = await prisma.carrierSourcingCandidate.createMany({
    data: candidates,
  });

  return { createdCount: created.count };
}

export async function requestCarrierCandidateQuote(
  loadId: string,
  candidateId: string,
  notes?: string,
) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const candidate = await prisma.carrierSourcingCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate || candidate.loadId !== loadId) {
    throw new Error("Carrier candidate not found.");
  }

  const carrier = candidate.carrierId
    ? await prisma.carrier.findUnique({ where: { id: candidate.carrierId } })
    : await findOrCreateCarrierFromCandidate(candidate);

  if (!carrier) {
    throw new Error("Unable to create carrier from candidate.");
  }

  await prisma.$transaction([
    prisma.carrierSourcingCandidate.update({
      where: { id: candidate.id },
      data: {
        carrierId: carrier.id,
        status: "QUOTE_REQUESTED",
        notes: mergeNotes(candidate.notes, notes),
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId,
        type: "LOCATION_UPDATE",
        message: `Coverage requested from ${candidate.companyName}.`,
        occurredAt: new Date(),
      },
    }),
  ]);
}

async function findOrCreateCarrierFromCandidate(candidate: {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
}) {
  if (!prisma) {
    return null;
  }
  const lookupConditions = [
    {
      companyName: {
        equals: candidate.companyName,
        mode: "insensitive" as const,
      },
    },
    ...(candidate.mcNumber ? [{ mcNumber: candidate.mcNumber }] : []),
    ...(candidate.dotNumber ? [{ dotNumber: candidate.dotNumber }] : []),
  ];

  const existing = await prisma.carrier.findFirst({
    where: {
      OR: lookupConditions,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.carrier.create({
    data: {
      companyName: candidate.companyName,
      contactName: candidate.contactName,
      phone: candidate.phone,
      email: candidate.email,
      mcNumber: candidate.mcNumber,
      dotNumber: candidate.dotNumber,
      complianceStatus: "PENDING",
    },
  });
}

function getCarrierMatchScore(
  load: {
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    equipmentType: string;
  },
  carrier: {
    complianceStatus: string;
    preferredLanes: unknown;
    notes: string | null;
    loads: Array<{
      originCity: string;
      originState: string;
      destinationCity: string;
      destinationState: string;
      equipmentType: string;
    }>;
  },
) {
  const laneText =
    `${load.originCity} ${load.originState} ${load.destinationCity} ${load.destinationState}`.toLowerCase();
  const preferredLaneText = Array.isArray(carrier.preferredLanes)
    ? carrier.preferredLanes.join(" ").toLowerCase()
    : "";
  const notes = carrier.notes?.toLowerCase() ?? "";
  const priorSameLane = carrier.loads.some(
    (candidateLoad) =>
      candidateLoad.originState === load.originState &&
      candidateLoad.destinationState === load.destinationState,
  );
  const priorSameEquipment = carrier.loads.some(
    (candidateLoad) =>
      candidateLoad.equipmentType.toLowerCase() ===
      load.equipmentType.toLowerCase(),
  );

  const score =
    (carrier.complianceStatus === "APPROVED" ? 0.35 : 0.1) +
    (preferredLaneText &&
    laneText.split(" ").some((part) => preferredLaneText.includes(part))
      ? 0.25
      : 0) +
    (priorSameLane ? 0.2 : 0) +
    (priorSameEquipment ? 0.15 : 0) +
    (notes.includes(load.equipmentType.toLowerCase()) ? 0.05 : 0);

  return Number(Math.min(score, 1).toFixed(2));
}

function getSuggestedRate(
  load: {
    originState: string;
    destinationState: string;
    equipmentType: string;
  },
  carrierLoads: Array<{
    originState: string;
    destinationState: string;
    equipmentType: string;
    carrierRate: unknown;
  }>,
) {
  const matchingRates = carrierLoads
    .filter(
      (carrierLoad) =>
        carrierLoad.originState === load.originState &&
        carrierLoad.destinationState === load.destinationState &&
        carrierLoad.equipmentType.toLowerCase() ===
          load.equipmentType.toLowerCase(),
    )
    .map((carrierLoad) => Number(carrierLoad.carrierRate))
    .filter((rate) => Number.isFinite(rate) && rate > 0);

  if (!matchingRates.length) {
    return null;
  }

  return Math.round(
    matchingRates.reduce((total, rate) => total + rate, 0) /
      matchingRates.length,
  );
}

function buildCandidateNotes(
  load: { lane?: string; equipmentType: string },
  carrier: { complianceStatus: string; loads: unknown[] },
) {
  return [
    "Generated from internal carrier history.",
    `Compliance status is ${carrier.complianceStatus}.`,
    `Compared against ${load.equipmentType} requirement and ${carrier.loads.length} recent carrier loads.`,
  ].join(" ");
}

function mergeNotes(existingNotes: string | null, newNotes?: string) {
  return [existingNotes, newNotes].filter(Boolean).join("\n");
}
