import Link from "next/link";
import {
  ClipboardList,
  DollarSign,
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
import { getAdminControlsView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminControlsPage() {
  const view = await getAdminControlsView();

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
        />
        <Metric
          icon={Percent}
          label="Commission split"
          value={`${view.plan.totalPercent}%`}
          detail="Manager + client owner + Austin + company"
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
        />
        <Metric
          icon={ClipboardList}
          label="Audit events"
          value={view.auditLogs.length.toString()}
          detail="Recent sensitive changes"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <UserCog className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Internal user management
            </p>
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
            <div className="overflow-hidden rounded-md border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Commission plan
            </p>
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
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Commission forecast
            </p>
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
            <div className="overflow-hidden rounded-md border border-slate-100">
              <table className="w-full text-left text-sm">
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
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Audit log</p>
          </div>
          <div className="grid gap-3 p-5">
            {view.auditLogs.map((log) => (
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
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  By {log.userName}
                </p>
              </div>
            ))}
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
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
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
