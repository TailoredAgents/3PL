import { BarChart3, DollarSign, Package, TrendingUp, Truck, Users } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getAnalyticsData } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const { revenue, loadsByStatus, topLanes, topCarriers, salesFunnel, quoteConversion } = data;

  const totalLeads = salesFunnel.reduce((s, f) => s + f.count, 0);
  const wonLeads = salesFunnel.find((f) => f.stage === "Won")?.count ?? 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const maxLaneCount = Math.max(...topLanes.map((l) => l.count), 1);
  const maxStatusCount = Math.max(...loadsByStatus.map((s) => s.count), 1);
  const maxFunnelCount = Math.max(...salesFunnel.map((s) => s.count), 1);
  const maxQuoteCount = Math.max(...quoteConversion.map((s) => s.count), 1);

  return (
    <InternalShell
      active="Analytics"
      eyebrow="Reporting"
      title="Analytics"
      description="Revenue, margin, load throughput, lane performance, carrier usage, and sales funnel in one view."
    >
      {/* Revenue strip */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label="Total revenue (closed loads)"
          value={`$${revenue.totalRevenue.toLocaleString()}`}
          sub={`${revenue.loadCount} loads invoiced or paid`}
        />
        <StatCard
          icon={TrendingUp}
          label="Total gross profit"
          value={`$${revenue.totalGrossProfit.toLocaleString()}`}
          sub={`${revenue.avgMarginPercent.toFixed(1)}% avg margin`}
        />
        <StatCard
          icon={BarChart3}
          label="Revenue this month"
          value={`$${revenue.revenueThisMonth.toLocaleString()}`}
          sub={`$${revenue.grossProfitThisMonth.toLocaleString()} gross profit`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Load status snapshot */}
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <SectionHeader
            icon={Package}
            eyebrow="Operations"
            title="Load status snapshot"
          />
          <div className="mt-6 grid gap-2">
            {loadsByStatus.map((row) => (
              <div key={row.status} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{row.status}</span>
                    <span className="text-slate-500">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Carrier scoreboard */}
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <SectionHeader
            icon={Truck}
            eyebrow="Carrier usage"
            title="Top carriers by loads"
          />
          {topCarriers.length ? (
            <div className="mt-6 grid gap-3">
              {topCarriers.map((carrier, i) => (
                <div
                  key={carrier.name}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-bold text-slate-400">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{carrier.name}</p>
                    <p className="text-sm text-slate-500">
                      {carrier.loads} load{carrier.loads !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    ${carrier.totalGrossProfit.toLocaleString()} GP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No carrier data yet. Assign carriers to loads to populate this scoreboard." />
          )}
        </article>
      </section>

      {/* Top lanes */}
      <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <SectionHeader
          icon={BarChart3}
          eyebrow="Lane performance"
          title="Top lanes by volume"
        />
        {topLanes.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <th className="pb-3 pr-4">Origin</th>
                  <th className="pb-3 pr-4">Destination</th>
                  <th className="pb-3 pr-4 text-right">Loads</th>
                  <th className="pb-3 pr-4 text-right">Avg GP</th>
                  <th className="pb-3">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topLanes.map((lane) => (
                  <tr key={`${lane.origin}-${lane.destination}`} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium">{lane.origin}</td>
                    <td className="py-3 pr-4 text-slate-600">{lane.destination}</td>
                    <td className="py-3 pr-4 text-right font-bold">{lane.count}</td>
                    <td className="py-3 pr-4 text-right font-bold text-emerald-700">
                      ${lane.avgGrossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(lane.count / maxLaneCount) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No completed loads yet. Lane data populates from invoiced and paid loads." />
        )}
      </article>

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Sales funnel */}
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <SectionHeader
            icon={Users}
            eyebrow="Sales pipeline"
            title={`Sales funnel — ${conversionRate}% win rate`}
          />
          <div className="mt-6 grid gap-2">
            {salesFunnel.map((row) => (
              <div key={row.stage} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{row.stage}</span>
                    <span className="text-slate-500">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        row.stage === "Won"
                          ? "bg-emerald-500"
                          : row.stage === "Lost"
                            ? "bg-red-400"
                            : "bg-emerald-300"
                      }`}
                      style={{ width: `${(row.count / maxFunnelCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Quote conversion */}
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <SectionHeader
            icon={TrendingUp}
            eyebrow="Quoting"
            title="Quote request pipeline"
          />
          <div className="mt-6 grid gap-2">
            {quoteConversion.map((row) => (
              <div key={row.status} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{row.status}</span>
                    <span className="text-slate-500">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        row.status === "Accepted"
                          ? "bg-emerald-500"
                          : row.status === "Rejected"
                            ? "bg-red-400"
                            : "bg-emerald-300"
                      }`}
                      style={{ width: `${(row.count / maxQuoteCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </InternalShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{sub}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-5 w-5 flex-none text-emerald-600" />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
      {text}
    </div>
  );
}
