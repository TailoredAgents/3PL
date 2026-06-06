import { BarChart3, DollarSign, Package, TrendingUp, Truck, Users } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getAnalyticsData } from "@/lib/crm";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
] as const;

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

  const revenueCards = [
    {
      icon: DollarSign,
      label: "Total revenue",
      value: `$${revenue.totalRevenue.toLocaleString()}`,
      sub: `${revenue.loadCount} loads invoiced or paid`,
    },
    {
      icon: TrendingUp,
      label: "Total gross profit",
      value: `$${revenue.totalGrossProfit.toLocaleString()}`,
      sub: `${revenue.avgMarginPercent.toFixed(1)}% avg margin`,
    },
    {
      icon: BarChart3,
      label: "Revenue this month",
      value: `$${revenue.revenueThisMonth.toLocaleString()}`,
      sub: `$${revenue.grossProfitThisMonth.toLocaleString()} gross profit`,
    },
  ];

  return (
    <InternalShell
      active="Analytics"
      eyebrow="Reporting"
      title="Analytics"
      description="Revenue, margin, load throughput, lane performance, carrier usage, and sales funnel in one view."
    >
      {/* Revenue cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {revenueCards.map((item, i) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-slate-500">{item.sub}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Load status snapshot */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Package className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Load status snapshot</p>
          </div>
          <div className="grid gap-2.5 p-5">
            {loadsByStatus.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.status}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${statusBarColor(row.status)}`}
                    style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Carrier scoreboard */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Truck className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Top carriers by loads</p>
          </div>
          {topCarriers.length ? (
            <div className="grid gap-2 p-5">
              {topCarriers.map((carrier, i) => (
                <div
                  key={carrier.name}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{carrier.name}</p>
                    <p className="text-xs text-slate-500">
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
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Top lanes by volume</p>
        </div>
        {topLanes.length ? (
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
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
                    <td className="py-3 pr-4 font-medium text-slate-900">{lane.origin}</td>
                    <td className="py-3 pr-4 text-slate-500">{lane.destination}</td>
                    <td className="py-3 pr-4 text-right font-bold text-slate-900">{lane.count}</td>
                    <td className="py-3 pr-4 text-right font-bold text-emerald-700">
                      ${lane.avgGrossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-400"
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
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Sales funnel</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {conversionRate}% win rate
            </span>
          </div>
          <div className="grid gap-2.5 p-5">
            {salesFunnel.map((row) => (
              <div key={row.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.stage}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${funnelBarColor(row.stage)}`}
                    style={{ width: `${(row.count / maxFunnelCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Quote conversion */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Quote request pipeline</p>
          </div>
          <div className="grid gap-2.5 p-5">
            {quoteConversion.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.status}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${quoteBarColor(row.status)}`}
                    style={{ width: `${(row.count / maxQuoteCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </InternalShell>
  );
}

function statusBarColor(status: string) {
  const map: Record<string, string> = {
    Tendered: "bg-amber-400",
    Booked: "bg-sky-400",
    "Picked Up": "bg-blue-400",
    "In Transit": "bg-emerald-500",
    Delivered: "bg-violet-400",
    "Pod Received": "bg-emerald-400",
    Invoiced: "bg-slate-400",
    Paid: "bg-lime-500",
  };
  return map[status] ?? "bg-emerald-400";
}

function funnelBarColor(stage: string) {
  const map: Record<string, string> = {
    New: "bg-sky-400",
    Contacted: "bg-cyan-400",
    Qualified: "bg-emerald-400",
    Quoted: "bg-amber-400",
    Won: "bg-lime-500",
    Lost: "bg-red-400",
  };
  return map[stage] ?? "bg-emerald-400";
}

function quoteBarColor(status: string) {
  const map: Record<string, string> = {
    New: "bg-sky-400",
    Pricing: "bg-amber-400",
    Quoted: "bg-emerald-400",
    Accepted: "bg-lime-500",
    Rejected: "bg-red-400",
  };
  return map[status] ?? "bg-emerald-400";
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="px-5 py-8 text-center text-sm text-slate-400">{text}</p>
  );
}
