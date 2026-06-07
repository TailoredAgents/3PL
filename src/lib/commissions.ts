import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import type { InternalUserView } from "@/lib/current-user";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const defaultCommissionSplit = {
  managingUserPercent: 35,
  customerOwnerPercent: 15,
  houseOwnerPercent: 20,
  companyPercent: 30,
} as const;

const defaultTeamNames = ["Austin", "Conner", "Devon", "Michael"] as const;

export type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type CommissionPlanView = {
  id: string | null;
  name: string;
  managingUserPercent: number;
  customerOwnerPercent: number;
  houseOwnerPercent: number;
  companyPercent: number;
  houseOwnerUserId: string | null;
  houseOwnerName: string;
  totalPercent: number;
  notes: string | null;
};

export type CommissionLoadView = {
  id: string;
  loadNumber: string;
  shipper: string;
  lane: string;
  status: string;
  grossProfit: number;
  managingUserName: string;
  customerOwnerName: string;
  houseOwnerName: string;
  managerShare: number;
  customerOwnerShare: number;
  houseOwnerShare: number;
  companyShare: number;
  href: string;
};

export type CommissionPersonView = {
  name: string;
  role: string;
  managerShare: number;
  customerOwnerShare: number;
  houseOwnerShare: number;
  total: number;
};

export type AdminControlsView = {
  users: UserOption[];
  missingDefaultUsers: string[];
  plan: CommissionPlanView;
  commission: {
    totalGrossProfit: number;
    managerPool: number;
    customerOwnerPool: number;
    houseOwnerPool: number;
    companyPool: number;
    people: CommissionPersonView[];
    loads: CommissionLoadView[];
  };
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    userName: string;
    created: string;
  }>;
};

export async function getUserOptions(): Promise<UserOption[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));
}

export async function getAdminControlsView(): Promise<AdminControlsView> {
  if (!hasDatabaseUrl() || !prisma) {
    return getSampleAdminControlsView();
  }

  try {
    const [users, plan, loads, auditLogs] = await Promise.all([
      getUserOptions(),
      getCommissionPlan(),
      prisma.load.findMany({
        where: { grossProfit: { not: null } },
        include: {
          managingUser: { select: { id: true, name: true } },
          customerOwner: { select: { id: true, name: true } },
          shipper: {
            select: {
              companyName: true,
              acquisitionOwner: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 250,
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    const commissionLoads = loads.map((load) =>
      buildCommissionLoad({
        id: load.id,
        loadNumber: load.loadNumber,
        shipper: load.shipper.companyName,
        lane: `${load.originCity}, ${load.originState} -> ${load.destinationCity}, ${load.destinationState}`,
        status: load.status,
        grossProfit: Number(load.grossProfit ?? 0),
        managingUser: load.managingUser,
        customerOwner: load.customerOwner ?? load.shipper.acquisitionOwner,
        plan,
      }),
    );
    const people = aggregateCommissionPeople(commissionLoads);

    return {
      users,
      missingDefaultUsers: getMissingDefaultUsers(users),
      plan,
      commission: {
        totalGrossProfit: sum(commissionLoads.map((load) => load.grossProfit)),
        managerPool: sum(commissionLoads.map((load) => load.managerShare)),
        customerOwnerPool: sum(
          commissionLoads.map((load) => load.customerOwnerShare),
        ),
        houseOwnerPool: sum(
          commissionLoads.map((load) => load.houseOwnerShare),
        ),
        companyPool: sum(commissionLoads.map((load) => load.companyShare)),
        people,
        loads: commissionLoads,
      },
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        summary: log.summary,
        userName: log.user?.name ?? "System",
        created: formatDateTime(log.createdAt),
      })),
    };
  } catch {
    return getSampleAdminControlsView();
  }
}

export async function getCommissionPlan(): Promise<CommissionPlanView> {
  if (!hasDatabaseUrl() || !prisma) {
    return getDefaultCommissionPlanView();
  }

  const plan = await prisma.commissionPlan.findFirst({
    where: { active: true },
    include: { houseOwner: { select: { id: true, name: true } } },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!plan) {
    return getDefaultCommissionPlanView();
  }

  const view = {
    id: plan.id,
    name: plan.name,
    managingUserPercent: Number(plan.managingUserPercent),
    customerOwnerPercent: Number(plan.customerOwnerPercent),
    houseOwnerPercent: Number(plan.houseOwnerPercent),
    companyPercent: Number(plan.companyPercent),
    houseOwnerUserId: plan.houseOwnerUserId,
    houseOwnerName: plan.houseOwner?.name ?? "Austin",
    notes: plan.notes,
  };

  return {
    ...view,
    totalPercent:
      view.managingUserPercent +
      view.customerOwnerPercent +
      view.houseOwnerPercent +
      view.companyPercent,
  };
}

export async function upsertInternalUser(input: {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  currentUser?: InternalUserView | null;
}) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      phone: input.phone || null,
    },
    create: {
      name: input.name,
      email: input.email,
      role: input.role,
      phone: input.phone || null,
    },
  });

  await logAudit({
    action: existing ? "USER_UPDATED" : "USER_INVITED",
    entityType: "User",
    entityId: user.id,
    summary: `${input.name} set as ${input.role}.`,
    user: input.currentUser,
    beforeJson: existing
      ? { name: existing.name, email: existing.email, role: existing.role }
      : null,
    afterJson: { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/admin");
  revalidatePath("/settings");
}

export async function saveCommissionPlan(input: {
  managingUserPercent: number;
  customerOwnerPercent: number;
  houseOwnerPercent: number;
  companyPercent: number;
  houseOwnerUserId?: string | null;
  notes?: string | null;
  currentUser?: InternalUserView | null;
}) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  const total =
    input.managingUserPercent +
    input.customerOwnerPercent +
    input.houseOwnerPercent +
    input.companyPercent;

  if (Math.round(total * 100) / 100 !== 100) {
    throw new Error("Commission percentages must total 100%.");
  }

  const existing = await prisma.commissionPlan.findFirst({
    where: { active: true },
    orderBy: { effectiveFrom: "desc" },
  });
  const plan = existing
    ? await prisma.commissionPlan.update({
        where: { id: existing.id },
        data: {
          managingUserPercent: input.managingUserPercent,
          customerOwnerPercent: input.customerOwnerPercent,
          houseOwnerPercent: input.houseOwnerPercent,
          companyPercent: input.companyPercent,
          houseOwnerUserId: input.houseOwnerUserId || null,
          notes: input.notes,
        },
      })
    : await prisma.commissionPlan.create({
        data: {
          name: "DAO standard gross profit split",
          managingUserPercent: input.managingUserPercent,
          customerOwnerPercent: input.customerOwnerPercent,
          houseOwnerPercent: input.houseOwnerPercent,
          companyPercent: input.companyPercent,
          houseOwnerUserId: input.houseOwnerUserId || null,
          notes: input.notes,
        },
      });

  await logAudit({
    action: "COMMISSION_PLAN_UPDATED",
    entityType: "CommissionPlan",
    entityId: plan.id,
    summary: `Commission split set to ${input.managingUserPercent}/${input.customerOwnerPercent}/${input.houseOwnerPercent}/${input.companyPercent}.`,
    user: input.currentUser,
    beforeJson: existing
      ? {
          managingUserPercent: Number(existing.managingUserPercent),
          customerOwnerPercent: Number(existing.customerOwnerPercent),
          houseOwnerPercent: Number(existing.houseOwnerPercent),
          companyPercent: Number(existing.companyPercent),
          houseOwnerUserId: existing.houseOwnerUserId,
        }
      : null,
    afterJson: {
      managingUserPercent: input.managingUserPercent,
      customerOwnerPercent: input.customerOwnerPercent,
      houseOwnerPercent: input.houseOwnerPercent,
      companyPercent: input.companyPercent,
      houseOwnerUserId: input.houseOwnerUserId || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/analytics");
}

export async function updateLoadCommissionAttribution(input: {
  loadId: string;
  managingUserId?: string | null;
  customerOwnerUserId?: string | null;
  applyToClient?: boolean;
  currentUser?: InternalUserView | null;
}) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  const existing = await prisma.load.findUnique({
    where: { id: input.loadId },
    select: {
      id: true,
      loadNumber: true,
      shipperId: true,
      managingUserId: true,
      customerOwnerUserId: true,
      shipper: { select: { acquisitionOwnerUserId: true } },
    },
  });

  if (!existing) {
    throw new Error("Load not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.load.update({
      where: { id: input.loadId },
      data: {
        managingUserId: input.managingUserId || null,
        customerOwnerUserId: input.customerOwnerUserId || null,
      },
    });

    if (input.applyToClient && input.customerOwnerUserId) {
      await tx.shipper.update({
        where: { id: existing.shipperId },
        data: { acquisitionOwnerUserId: input.customerOwnerUserId },
      });
    }
  });

  await logAudit({
    action: "LOAD_COMMISSION_ATTRIBUTION_UPDATED",
    entityType: "Load",
    entityId: input.loadId,
    summary: `Commission attribution updated for LD-${String(existing.loadNumber).padStart(4, "0")}.`,
    user: input.currentUser,
    beforeJson: {
      managingUserId: existing.managingUserId,
      customerOwnerUserId: existing.customerOwnerUserId,
      shipperAcquisitionOwnerUserId: existing.shipper.acquisitionOwnerUserId,
    },
    afterJson: {
      managingUserId: input.managingUserId || null,
      customerOwnerUserId: input.customerOwnerUserId || null,
      appliedToClient: Boolean(input.applyToClient),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/loads");
  revalidatePath(`/loads/${input.loadId}`);
  revalidatePath("/analytics");
}

export function buildCommissionLoad(input: {
  id: string;
  loadNumber?: number | null;
  shipper: string;
  lane: string;
  status: string;
  grossProfit: number;
  managingUser?: { id: string; name: string } | null;
  customerOwner?: { id: string; name: string } | null;
  plan: CommissionPlanView;
}): CommissionLoadView {
  const managerShare = splitAmount(
    input.grossProfit,
    input.plan.managingUserPercent,
  );
  const customerOwnerShare = splitAmount(
    input.grossProfit,
    input.plan.customerOwnerPercent,
  );
  const houseOwnerShare = splitAmount(
    input.grossProfit,
    input.plan.houseOwnerPercent,
  );
  const companyShare = splitAmount(input.grossProfit, input.plan.companyPercent);

  return {
    id: input.id,
    loadNumber: input.loadNumber
      ? `LD-${String(input.loadNumber).padStart(4, "0")}`
      : "LD-????",
    shipper: input.shipper,
    lane: input.lane,
    status: titleCaseEnum(input.status),
    grossProfit: input.grossProfit,
    managingUserName: input.managingUser?.name ?? "Unassigned manager",
    customerOwnerName: input.customerOwner?.name ?? "Unassigned client owner",
    houseOwnerName: input.plan.houseOwnerName,
    managerShare,
    customerOwnerShare,
    houseOwnerShare,
    companyShare,
    href: `/loads/${input.id}`,
  };
}

function getDefaultCommissionPlanView(): CommissionPlanView {
  return {
    id: null,
    name: "DAO standard gross profit split",
    ...defaultCommissionSplit,
    houseOwnerUserId: null,
    houseOwnerName: "Austin",
    totalPercent: 100,
    notes:
      "Manager 35%, lifetime client converter 15%, Austin/house owner 20%, company 30%.",
  };
}

function aggregateCommissionPeople(loads: CommissionLoadView[]) {
  const people = new Map<string, CommissionPersonView>();

  for (const load of loads) {
    addPersonShare(people, load.managingUserName, "Load manager", {
      managerShare: load.managerShare,
    });
    addPersonShare(people, load.customerOwnerName, "Client owner", {
      customerOwnerShare: load.customerOwnerShare,
    });
    addPersonShare(people, load.houseOwnerName, "House owner", {
      houseOwnerShare: load.houseOwnerShare,
    });
  }

  return [...people.values()]
    .map((person) => ({
      ...person,
      total:
        person.managerShare +
        person.customerOwnerShare +
        person.houseOwnerShare,
    }))
    .sort((a, b) => b.total - a.total);
}

function addPersonShare(
  people: Map<string, CommissionPersonView>,
  name: string,
  role: string,
  share: Partial<
    Pick<
      CommissionPersonView,
      "managerShare" | "customerOwnerShare" | "houseOwnerShare"
    >
  >,
) {
  const existing = people.get(name) ?? {
    name,
    role,
    managerShare: 0,
    customerOwnerShare: 0,
    houseOwnerShare: 0,
    total: 0,
  };

  people.set(name, {
    ...existing,
    role: existing.role === role ? role : "Multiple roles",
    managerShare: existing.managerShare + (share.managerShare ?? 0),
    customerOwnerShare:
      existing.customerOwnerShare + (share.customerOwnerShare ?? 0),
    houseOwnerShare: existing.houseOwnerShare + (share.houseOwnerShare ?? 0),
  });
}

function getMissingDefaultUsers(users: UserOption[]) {
  const userNames = users.map((user) => user.name.toLowerCase());

  return defaultTeamNames.filter(
    (name) =>
      !userNames.some((userName) => userName.includes(name.toLowerCase())),
  );
}

function getSampleAdminControlsView(): AdminControlsView {
  const users = [
    { id: "austin", name: "Austin", email: "austin@example.com", role: "OWNER" },
    { id: "conner", name: "Conner", email: "conner@example.com", role: "OWNER" },
    { id: "devon", name: "Devon", email: "devon@example.com", role: "OPS" },
    { id: "michael", name: "Michael", email: "michael@example.com", role: "SALES" },
  ];
  const plan = getDefaultCommissionPlanView();
  const loads = [
    buildCommissionLoad({
      id: "sample-load-1",
      loadNumber: 1042,
      shipper: "Sample Foods",
      lane: "Atlanta, GA -> Dallas, TX",
      status: "POD_RECEIVED",
      grossProfit: 1200,
      managingUser: { id: "devon", name: "Devon" },
      customerOwner: { id: "michael", name: "Michael" },
      plan,
    }),
  ];

  return {
    users,
    missingDefaultUsers: [],
    plan,
    commission: {
      totalGrossProfit: 1200,
      managerPool: 420,
      customerOwnerPool: 180,
      houseOwnerPool: 240,
      companyPool: 360,
      people: aggregateCommissionPeople(loads),
      loads,
    },
    auditLogs: [
      {
        id: "sample-audit",
        action: "COMMISSION_PLAN_UPDATED",
        entityType: "CommissionPlan",
        entityId: "sample",
        summary: "Sample audit trail; database logs appear here in production.",
        userName: "System",
        created: "Now",
      },
    ],
  };
}

function splitAmount(amount: number, percent: number) {
  return Math.round(amount * percent) / 100;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
