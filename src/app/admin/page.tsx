import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Percent,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import {
  AdminUserForm,
  CommissionPlanSettingsForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { requireInternalRole } from "@/lib/current-user";
import { getAdminControlsView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminControlsPage() {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const view = await getAdminControlsView();
  const authReady = view.auth.clerkConfigured && view.auth.webhookConfigured;
  const commissionPlanValid = view.plan.totalPercent === 100;
  const unassignedLoads = view.commission.loads.filter(
    (load) =>
      load.managingUserName.startsWith("Unassigned") ||
      load.customerOwnerName.startsWith("Unassigned"),
  ).length;

  return (
    <InternalShell
      active="Admin Controls"
      eyebrow="Admin"
      title="Admin Controls"
      description="Manage internal users, commission attribution, audit visibility, and sensitive operating controls."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={DollarSign}
          label="Gross profit forecast"
          value={toCurrency(view.commission.totalGrossProfit)}
          detail="Loads with gross profit entered"
          tone="emerald"
        />
        <Metric
          icon={CheckCircle2}
          label="Commission ready"
          value={toCurrency(view.commission.payoutReadyCommission)}
          detail={`${view.commission.payoutReadyLoads} loads with customer and carrier payments complete`}
          tone="sky"
        />
        <Metric
          icon={Percent}
          label="Commission split"
          value={`${view.plan.totalPercent}%`}
          detail="Manager + client owner + Austin + company"
          tone={commissionPlanValid ? "violet" : "red"}
        />
        <Metric
          icon={Users}
          label="Internal users"
          value={view.users.length.toString()}
          detail={
            view.missingDefaultUsers.length
              ? `${view.missingDefaultUsers.join(", ")} still need profiles`
              : "Core team profiles present"
          }
          tone={view.missingDefaultUsers.length ? "amber" : "emerald"}
        />
        <Metric
          icon={ClipboardList}
          label="Audit events"
          value={view.auditLogs.length.toString()}
          detail="Recent sensitive changes"
          tone="slate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <article
          className={`rounded-lg border p-5 shadow-sm ${
            authReady && !view.missingDefaultUsers.length && commissionPlanValid
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Owner readiness
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {authReady && !view.missingDefaultUsers.length && commissionPlanValid
                  ? "Core admin setup is ready."
                  : "Core admin setup still needs attention."}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Add the four core users, keep Clerk sync healthy, and maintain the 100%
                commission plan before relying on automated attribution or payouts.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Admin checklist
          </p>
          <div className="mt-4 grid gap-3">
            <ChecklistItem
              complete={!view.missingDefaultUsers.length}
              label="Core users created"
              detail={
                view.missingDefaultUsers.length
                  ? `${view.missingDefaultUsers.join(", ")} still missing`
                  : "Austin, Conner, Devon, and Michael are represented"
              }
            />
            <ChecklistItem
              complete={authReady}
              label="Clerk auth and webhook configured"
              detail="Required before sending real invitations and syncing user changes"
            />
            <ChecklistItem
              complete={commissionPlanValid}
              label="Commission split totals 100%"
              detail={`${view.plan.totalPercent}% currently allocated`}
            />
            <ChecklistItem
              complete={!unassignedLoads}
              label="Load attribution assigned"
              detail={
                unassignedLoads
                  ? `${unassignedLoads} load${unassignedLoads === 1 ? "" : "s"} need manager or client owner`
                  : "Visible loads have commission owners"
              }
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <AuthReadiness
          icon={view.auth.clerkConfigured ? CheckCircle2 : AlertCircle}
          label="Clerk authentication"
          ready={view.auth.clerkConfigured}
          detail={
            view.auth.clerkConfigured
              ? "Clerk env vars are configured for internal login and invitations."
              : "Set Clerk publishable and secret keys before sending real invites."
          }
        />
        <AuthReadiness
          icon={view.auth.webhookConfigured ? CheckCircle2 : AlertCircle}
          label="Clerk webhook sync"
          ready={view.auth.webhookConfigured}
          detail={
            view.auth.webhookConfigured
              ? "Webhook signing secret is present; user.created/updated/deleted can sync."
              : "Set CLERK_WEBHOOK_SIGNING_SECRET and point Clerk to /api/webhooks/clerk."
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Internal user management
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Owner, admin, sales, and operations users used for auth and commissions.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
              {view.users.length} users
            </span>
          </div>
          <div className="grid gap-5 p-5">
            {view.missingDefaultUsers.length ? (
              <div className="rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-900">
                Add user records for {view.missingDefaultUsers.join(", ")} using
                their real work emails so Clerk sync and commission attribution
                have stable users.
              </div>
            ) : null}
            <AdminUserForm />
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Clerk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {view.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-700">
                          {user.deactivatedAt
                            ? "Deactivated"
                            : user.clerkUserId
                              ? "Accepted"
                              : user.invitationStatus
                                ? user.invitationStatus
                                : "Local only"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.lastClerkSyncedAt
                            ? `Synced ${user.lastClerkSyncedAt}`
                            : user.invitationSentAt
                              ? `Invited ${user.invitationSentAt}`
                              : "No Clerk sync yet"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!view.users.length ? (
                <p className="border-t border-slate-100 px-4 py-5 text-center text-sm text-slate-400">
                  No internal users have been added yet.
                </p>
              ) : null}
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Commission plan
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Default split used for manager, client owner, Austin, and company payout pools.
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                commissionPlanValid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {view.plan.totalPercent}%
            </span>
          </div>
          <div className="grid gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <SplitTile label="Manager" value={view.plan.managingUserPercent} />
              <SplitTile
                label="Client owner"
                value={view.plan.customerOwnerPercent}
              />
              <SplitTile label="Austin" value={view.plan.houseOwnerPercent} />
              <SplitTile label="Company" value={view.plan.companyPercent} />
            </div>
            <CommissionPlanSettingsForm plan={view.plan} users={view.users} />
            {view.plan.totalPercent !== 100 ? (
              <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-800">
                Current commission plan totals {view.plan.totalPercent}%. It
                must equal 100%.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Commission forecast
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Forecast only until customer payment and carrier settlement make payout ready.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <PoolTile label="Manager pool" value={view.commission.managerPool} />
              <PoolTile
                label="Client owner pool"
                value={view.commission.customerOwnerPool}
              />
              <PoolTile label="Austin pool" value={view.commission.houseOwnerPool} />
              <PoolTile label="Company" value={view.commission.companyPool} />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Manager</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Austin</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {view.commission.people.map((person) => (
                    <tr key={person.name}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {person.name}
                        </p>
                        <p className="text-xs text-slate-500">{person.role}</p>
                      </td>
                      <td className="px-4 py-3">{toCurrency(person.managerShare)}</td>
                      <td className="px-4 py-3">
                        {toCurrency(person.customerOwnerShare)}
                      </td>
                      <td className="px-4 py-3">
                        {toCurrency(person.houseOwnerShare)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-950">
                        {toCurrency(person.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Audit log</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sensitive admin changes and commission updates.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
              {view.auditLogs.length}
            </span>
          </div>
          <div className="grid gap-3 p-5">
            {view.auditLogs.length ? (
              view.auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {log.action.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {log.created}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {log.summary}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-500">
                    By {log.userName}
                  </p>
                  <Link
                    href={`/admin/audit/${log.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Details <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              ))
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">
                No audit events have been logged yet.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <ClipboardList className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">
            Load attribution review
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3">Load</th>
                <th className="px-5 py-3">Gross profit</th>
                <th className="px-5 py-3">Manager</th>
                <th className="px-5 py-3">Client owner</th>
                <th className="px-5 py-3">Austin</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {view.commission.loads.slice(0, 40).map((load) => (
                <tr key={load.id} className="hover:bg-emerald-50/40">
                  <td className="px-5 py-4">
                    <Link
                      href={load.href}
                      className="font-semibold text-slate-950 hover:text-emerald-700"
                    >
                      {load.loadNumber} · {load.shipper}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {load.lane} · {load.status}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {toCurrency(load.grossProfit)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{load.managingUserName}</p>
                    <p className="text-xs text-slate-500">
                      {toCurrency(load.managerShare)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{load.customerOwnerName}</p>
                    <p className="text-xs text-slate-500">
                      {toCurrency(load.customerOwnerShare)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{load.houseOwnerName}</p>
                    <p className="text-xs text-slate-500">
                      {toCurrency(load.houseOwnerShare)}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {toCurrency(load.companyShare)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        load.payoutReady
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {load.payoutReady ? "Ready" : "Hold"}
                    </span>
                    <p className="mt-1 max-w-[180px] text-xs leading-5 text-slate-500">
                      {load.payoutReadiness}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </InternalShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald" | "red" | "sky" | "slate" | "violet";
}) {
  const toneClasses = {
    amber: {
      card: "border-l-amber-400",
      icon: "bg-amber-50 text-amber-700",
    },
    emerald: {
      card: "border-l-emerald-400",
      icon: "bg-emerald-50 text-emerald-700",
    },
    red: {
      card: "border-l-red-400",
      icon: "bg-red-50 text-red-700",
    },
    sky: {
      card: "border-l-sky-400",
      icon: "bg-sky-50 text-sky-700",
    },
    slate: {
      card: "border-l-slate-400",
      icon: "bg-slate-100 text-slate-600",
    },
    violet: {
      card: "border-l-violet-400",
      icon: "bg-violet-50 text-violet-700",
    },
  }[tone];

  return (
    <article
      className={`rounded-lg border border-l-4 border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5 ${toneClasses.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function ChecklistItem({
  complete,
  label,
  detail,
}: {
  complete: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function AuthReadiness({
  icon: Icon,
  label,
  ready,
  detail,
}: {
  icon: typeof CheckCircle2;
  label: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-md ${
            ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function SplitTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}%</p>
    </div>
  );
}

function PoolTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">
        {toCurrency(value)}
      </p>
    </div>
  );
}
