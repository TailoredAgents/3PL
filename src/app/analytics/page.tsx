import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  Target,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

import {
  LaneMarginRuleCreateForm,
  LaneQuoteTemplateCreateForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import {
  getAnalyticsData,
  type AnalyticsData,
  type LaneIntelligenceProfile,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

type Tone = "amber" | "emerald" | "red" | "sky";

const CARD_ACCENTS = [
  {
    border: "border-l-[3px] border-l-violet-400",
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  },
  {
    border: "border-l-[3px] border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
  {
    border: "border-l-[3px] border-l-sky-400",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  {
    border: "border-l-[3px] border-l-amber-400",
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  },
] as const;

const panelClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25";
const panelHeaderClass =
  "border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40";

function getAnalyticsCommand(laneIntelligence: AnalyticsData["laneIntelligence"]) {
  const topOpportunity = laneIntelligence.opportunities[0];

  if (topOpportunity) {
    return {
      title: topOpportunity.title,
      detail: topOpportunity.detail,
      impact: topOpportunity.impact,
      tone: topOpportunity.tone,
      icon: AlertTriangle,
    };
  }

  if (laneIntelligence.repeatLanes > 0) {
    return {
      title: "Build repeat-lane discipline",
      detail: `${laneIntelligence.repeatLanes} lane${laneIntelligence.repeatLanes === 1 ? "" : "s"} have enough activity to support saved quote templates or margin rules.`,
      impact: "Turn repeat freight into faster quoting and more consistent gross profit.",
      tone: "emerald" as const,
      icon: Target,
    };
  }

  return {
    title: "Keep building clean history",
    detail: "Analytics will get sharper as more quotes, invoices, carrier coverage, and lane benchmarks are recorded.",
    impact: "Prioritize complete load records so lane intelligence can guide pricing.",
    tone: "sky" as const,
    icon: BarChart3,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const {
    revenue,
    loadsByStatus,
    topLanes,
    laneIntelligence,
    laneRuleManagement,
    topCarriers,
    salesFunnel,
    quoteConversion,
  } = data;

  const totalLeads = salesFunnel.reduce((sum, stage) => sum + stage.count, 0);
  const wonLeads = salesFunnel.find((stage) => stage.stage === "Won")?.count ?? 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const maxLaneCount = Math.max(...topLanes.map((lane) => lane.count), 1);
  const maxStatusCount = Math.max(...loadsByStatus.map((status) => status.count), 1);
  const maxFunnelCount = Math.max(...salesFunnel.map((stage) => stage.count), 1);
  const maxQuoteCount = Math.max(...quoteConversion.map((status) => status.count), 1);
  const command = getAnalyticsCommand(laneIntelligence);
  const CommandIcon = command.icon;

  const executiveCards = [
    {
      icon: DollarSign,
      label: "Revenue",
      value: formatCurrency(revenue.totalRevenue),
      sub: `${revenue.loadCount} loads invoiced or paid`,
    },
    {
      icon: TrendingUp,
      label: "Gross profit",
      value: formatCurrency(revenue.totalGrossProfit),
      sub: `${revenue.avgMarginPercent.toFixed(1)}% average margin`,
    },
    {
      icon: Target,
      label: "Quote confidence",
      value: `${laneIntelligence.avgQuoteConfidence}%`,
      sub: "History, benchmarks, carrier depth",
    },
    {
      icon: AlertTriangle,
      label: "Underpriced lanes",
      value: laneIntelligence.underpricedLanes.toLocaleString(),
      sub: "Below 15% average gross margin",
    },
  ];

  return (
    <InternalShell
      active="Analytics"
      eyebrow="Reporting"
      title="Analytics"
      description="Executive view of revenue, margin, lane performance, carrier usage, quote quality, and sales funnel health."
    >
      <section className="grid items-start gap-4 xl:grid-cols-[1.1fr_1.9fr]">
        <article className={`rounded-lg border p-5 shadow-sm ${opportunityToneClass(command.tone)}`}>
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
              <CommandIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Executive priority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{command.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-85">{command.detail}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] opacity-75">
                {command.impact}
              </p>
            </div>
          </div>
        </article>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {executiveCards.map((item, index) => (
            <MetricCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              sub={item.sub}
              accent={CARD_ACCENTS[index]}
            />
          ))}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
        <article className={panelClass}>
          <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${panelHeaderClass}`}>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">Lane intelligence</p>
            </div>
            <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {laneIntelligence.totalLanes} tracked lanes
            </span>
          </div>
          {laneIntelligence.profiles.length ? (
            <div className="grid gap-3 p-5">
              {laneIntelligence.profiles.slice(0, 5).map((lane) => (
                <LaneProfileCard key={lane.key} lane={lane} />
              ))}
            </div>
          ) : (
            <EmptyState text="Lane intelligence will populate once quotes or completed loads exist." />
          )}
        </article>

        <article className={panelClass}>
          <div className={`flex items-center gap-2 ${panelHeaderClass}`}>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Revenue opportunities</p>
          </div>
          {laneIntelligence.opportunities.length ? (
            <div className="grid gap-3 p-5">
              {laneIntelligence.opportunities.map((opportunity) => (
                <div
                  key={`${opportunity.title}-${opportunity.detail}`}
                  className={`rounded-lg border p-4 ${opportunityToneClass(opportunity.tone)}`}
                >
                  <p className="text-sm font-black">{opportunity.title}</p>
                  <p className="mt-1 text-sm leading-6">{opportunity.detail}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em]">{opportunity.impact}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No lane revenue gaps detected yet." />
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className={panelClass}>
          <div className={`flex items-center gap-2 ${panelHeaderClass}`}>
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Top lanes by volume</p>
          </div>
          {topLanes.length ? (
            <div className="grid gap-3 p-5">
              {topLanes.map((lane) => (
                <div key={`${lane.origin}-${lane.destination}`} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{lane.origin} → {lane.destination}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {lane.count} loads · {formatCurrency(lane.avgGrossProfit)} avg GP
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {lane.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${(lane.count / maxLaneCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No completed loads yet. Lane data populates from invoiced and paid loads." />
          )}
        </article>

        <article className={panelClass}>
          <div className={`flex items-center gap-2 ${panelHeaderClass}`}>
            <Truck className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Top carriers by gross profit</p>
          </div>
          {topCarriers.length ? (
            <div className="grid gap-2 p-5">
              {topCarriers.map((carrier, index) => (
                <div
                  key={carrier.name}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/45"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0 ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{carrier.name}</p>
                    <p className="text-xs text-slate-500">
                      {carrier.loads} load{carrier.loads !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(carrier.totalGrossProfit)} GP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No carrier data yet. Assign carriers to loads to populate this scoreboard." />
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PricingControlPanel
          title="Saved quote templates"
          icon={Target}
          summary={`${laneRuleManagement.templates.length} templates`}
        >
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Add recurring-lane template
            </summary>
            <div className="mt-4">
              <LaneQuoteTemplateCreateForm shipperOptions={laneRuleManagement.shippers} />
            </div>
          </details>
          {laneRuleManagement.templates.length ? (
            <div className="grid gap-3">
              {laneRuleManagement.templates.slice(0, 4).map((template) => (
                <div key={template.id} className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{template.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{template.shipper} · {template.lane} · {template.equipmentType}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {template.targetMarginPercent ?? "No"}% target
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Buy {template.targetCarrierCost === null ? "TBD" : formatCurrency(template.targetCarrierCost)}
                    {" / "}
                    Sell {template.customerRate === null ? "TBD" : formatCurrency(template.customerRate)}
                  </p>
                  {template.notes ? <p className="mt-2 text-xs leading-5 text-slate-500">{template.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No saved quote templates yet." />
          )}
        </PricingControlPanel>

        <PricingControlPanel
          title="Lane margin rules"
          icon={TrendingUp}
          summary={`${laneRuleManagement.rules.length} rules`}
        >
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Add margin rule
            </summary>
            <div className="mt-4">
              <LaneMarginRuleCreateForm shipperOptions={laneRuleManagement.shippers} />
            </div>
          </details>
          {laneRuleManagement.rules.length ? (
            <div className="grid gap-3">
              {laneRuleManagement.rules.slice(0, 5).map((rule) => (
                <div key={rule.id} className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{rule.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{rule.shipper} · {rule.lane}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{rule.equipmentType} · {rule.urgency}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                      {rule.targetMarginPercent}% target
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Minimum {rule.minimumMarginPercent ?? "none"}% · Priority {rule.priority}
                  </p>
                  {rule.notes ? <p className="mt-2 text-xs leading-5 text-slate-500">{rule.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No lane margin rules yet." />
          )}
        </PricingControlPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ProgressPanel title="Load status snapshot" icon={Package}>
          {loadsByStatus.map((row) => (
            <ProgressRow
              key={row.status}
              label={row.status}
              count={row.count}
              max={maxStatusCount}
              className={statusBarColor(row.status)}
            />
          ))}
        </ProgressPanel>

        <ProgressPanel title="Sales funnel" icon={Users} badge={`${conversionRate}% win rate`}>
          {salesFunnel.map((row) => (
            <ProgressRow
              key={row.stage}
              label={row.stage}
              count={row.count}
              max={maxFunnelCount}
              className={funnelBarColor(row.stage)}
            />
          ))}
        </ProgressPanel>

        <ProgressPanel title="Quote request pipeline" icon={TrendingUp}>
          {quoteConversion.map((row) => (
            <ProgressRow
              key={row.status}
              label={row.status}
              count={row.count}
              max={maxQuoteCount}
              className={quoteBarColor(row.status)}
            />
          ))}
        </ProgressPanel>
      </section>
    </InternalShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent: (typeof CARD_ACCENTS)[number];
}) {
  return (
    <article className={`${panelClass} ${accent.border}`}>
      <div className="p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        <p className="mt-2 text-xs text-slate-500">{sub}</p>
      </div>
    </article>
  );
}

function LaneProfileCard({ lane }: { lane: LaneIntelligenceProfile }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr_1.05fr] xl:items-start">
        <div>
          <p className="font-black text-slate-950 dark:text-slate-50">{lane.origin} → {lane.destination}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {lane.equipment} · {lane.loadCount} loads · {lane.quoteRequestCount} quotes
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Top customer: {lane.topCustomer} · Latest: {lane.latestActivity}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <MiniStat label="Sell" value={formatCurrency(lane.avgSellRate)} />
          <MiniStat label="Buy" value={lane.avgBuyRate === null ? "TBD" : formatCurrency(lane.avgBuyRate)} />
          <MiniStat
            label="Margin"
            value={`${formatCurrency(lane.avgGrossProfit)} / ${lane.avgMarginPercent}%`}
            tone={lane.avgMarginPercent < 15 ? "red" : "emerald"}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${confidenceClass(lane.quoteConfidence)}`}>
              {lane.quoteConfidence}% confidence
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {lane.winRate}% win rate
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{lane.recommendation}</p>
          <p className="mt-1 text-xs text-slate-400">
            Carrier depth: {lane.carrierCount} · Top carrier: {lane.topCarrier}
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "emerald";
}) {
  return (
    <div className="rounded-md bg-white px-2 py-2 dark:bg-slate-900 dark:ring-1 dark:ring-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={`mt-1 font-black ${tone === "red" ? "text-red-700 dark:text-red-300" : tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-50"}`}>
        {value}
      </p>
    </div>
  );
}

function PricingControlPanel({
  title,
  icon: Icon,
  summary,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  summary: string;
  children: ReactNode;
}) {
  return (
    <article className={panelClass}>
      <div className={`flex items-center justify-between gap-3 ${panelHeaderClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-black text-slate-800 dark:text-slate-200">{title}</p>
        </div>
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {summary}
        </span>
      </div>
      <div className="grid gap-5 p-5">{children}</div>
    </article>
  );
}

function ProgressPanel({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <article className={panelClass}>
      <div className={`flex items-center justify-between gap-3 ${panelHeaderClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-black text-slate-800 dark:text-slate-200">{title}</p>
        </div>
        {badge ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="grid gap-2.5 p-5">{children}</div>
    </article>
  );
}

function ProgressRow({
  label,
  count,
  max,
  className,
}: {
  label: string;
  count: number;
  max: number;
  className: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs font-semibold text-slate-500">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${(count / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

function statusBarColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("tender")) return "bg-amber-400";
  if (normalized.includes("book")) return "bg-sky-400";
  if (normalized.includes("pickup")) return "bg-blue-400";
  if (normalized.includes("transit")) return "bg-emerald-400";
  if (normalized.includes("deliver")) return "bg-violet-400";
  if (normalized.includes("pod")) return "bg-teal-400";
  if (normalized.includes("invoice")) return "bg-slate-500";
  if (normalized.includes("paid")) return "bg-lime-500";
  return "bg-slate-300";
}

function funnelBarColor(stage: string) {
  const normalized = stage.toLowerCase();
  if (normalized.includes("new")) return "bg-sky-400";
  if (normalized.includes("contact")) return "bg-cyan-400";
  if (normalized.includes("qual")) return "bg-emerald-400";
  if (normalized.includes("quote")) return "bg-amber-400";
  if (normalized.includes("won")) return "bg-lime-500";
  if (normalized.includes("lost")) return "bg-red-400";
  return "bg-slate-300";
}

function quoteBarColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("new")) return "bg-sky-400";
  if (normalized.includes("pricing")) return "bg-amber-400";
  if (normalized.includes("quoted")) return "bg-emerald-400";
  if (normalized.includes("accept")) return "bg-lime-500";
  if (normalized.includes("reject")) return "bg-red-400";
  return "bg-slate-300";
}

function confidenceClass(confidence: number) {
  if (confidence >= 80) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200";
  if (confidence >= 60) return "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200";
  return "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200";
}

function opportunityToneClass(tone: Tone) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-900 dark:border-red-500/45 dark:bg-red-950/30 dark:text-red-100";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100";
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100";
  return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/45 dark:bg-sky-950/30 dark:text-sky-100";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="m-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-400">
      {text}
    </div>
  );
}
