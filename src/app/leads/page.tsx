import {
  Bot,
  CalendarClock,
  CheckCircle2,
  FileUp,
  Phone,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ContactImportForm, LeadCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { LeadKanbanCard } from "@/components/lead-kanban-card";
import { getActivityViews, getLeadViews } from "@/lib/crm";
import { leadStages } from "@/lib/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

export default async function LeadsPage() {
  const [leadViews, activityViews] = await Promise.all([
    getLeadViews(),
    getActivityViews(),
  ]);
  const highPriorityCount = leadViews.filter(
    (lead) => lead.priority === "High",
  ).length;
  const quoteReadyCount = leadViews.filter((lead) =>
    ["Qualified", "Quoted"].includes(lead.stage),
  ).length;
  const followUpLeads = leadViews.slice(0, 4);
  const topFollowUp = followUpLeads[0];

  const metrics = [
    { icon: Users, label: "Active leads", value: leadViews.length.toString(), helper: "Open sales records" },
    { icon: CalendarClock, label: "Follow-ups due", value: followUpLeads.length.toString(), helper: "Start here today" },
    { icon: Target, label: "High priority", value: highPriorityCount.toString(), helper: "Needs focused touch" },
    { icon: TrendingUp, label: "Quote-ready", value: quoteReadyCount.toString(), helper: "Qualified or quoted" },
  ];

  return (
    <InternalShell
      active="Leads"
      eyebrow="Sales & CRM"
      title="Leads"
      description="Who to call, what lane they care about, and where they sit in the pipeline."
      action={{ label: "Instant quote form", href: "/#quote" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, i) => (
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
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <article className="rounded-lg border border-amber-100 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Sales priority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                {topFollowUp ? `Call ${topFollowUp.company}` : "Pipeline is clear"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 opacity-85">
                {topFollowUp
                  ? `${topFollowUp.nextFollowUp} · ${topFollowUp.pain}`
                  : "No scheduled follow-ups are currently waiting. Add new prospects or review quote-ready accounts."}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Sales rhythm
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight">Touch, log, advance</h2>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-85">
                Work follow-ups first, record the result, then move leads toward quote-ready freight.
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Today's calls */}
      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">Today&apos;s calls</p>
          </div>
          <p className="text-xs text-slate-500">Start here before opening new work</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {followUpLeads.length ? followUpLeads.map((lead, index) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="grid gap-2 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{lead.company}</p>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-700">
                {lead.nextFollowUp}
              </p>
              <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                {lead.pain}
              </p>
            </Link>
          )) : (
            <div className="col-span-4 py-8 text-center text-sm text-slate-400">
              No follow-ups scheduled — pipeline is clear.
            </div>
          )}
        </div>
      </section>

      {/* Pipeline kanban */}
      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Pipeline board</p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {leadViews.length} leads
          </span>
        </div>

        <div className="overflow-x-auto p-4 pb-2">
          <div className="grid min-w-[1260px] grid-cols-6 gap-4">
            {leadStages.map((stage) => {
              const stageLeads = leadViews.filter(
                (lead) => lead.stage === stage,
              );

              return (
                <div
                  key={stage}
                  className="min-h-[280px] rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                      stageHeaderClass(stage),
                    )}
                  >
                    <p className="text-sm font-bold">{stage}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {stageLeads.length ? (
                      stageLeads.map((lead) => (
                        <LeadKanbanCard key={lead.id} lead={lead} />
                      ))
                    ) : (
                      <p className="px-2 py-4 text-xs text-slate-400">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Create lead + import — equal width */}
      <section className="grid items-start gap-6 xl:grid-cols-2">
        <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 hover:bg-slate-100/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50">
                <UserPlus className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Create lead</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Add a prospect with lane, equipment, volume, and follow-up context.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 group-open:hidden">Expand</span>
            <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">Collapse</span>
          </summary>
          <div className="border-t border-slate-200 p-5">
            <LeadCreateForm />
          </div>
        </details>

        <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 hover:bg-slate-100/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50">
                <FileUp className="h-4 w-4 text-sky-700" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Contact import</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Upload CSV prospects and preserve source context for follow-up.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 group-open:hidden">Expand</span>
            <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">Collapse</span>
          </summary>
          <div className="border-t border-slate-200 p-5">
            <ContactImportForm />
          </div>
        </details>
      </section>

      {/* AI assistant + Recent activity */}
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Bot className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-black text-slate-800">AI sales assistant</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Suggested next move by account.
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-4">
            {leadViews.length ? leadViews.map((lead) => (
              <Link
                key={lead.company}
                href={`/leads/${lead.id}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{lead.company}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stageBadgeClass(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lead.aiNextAction}
                </p>
              </Link>
            )) : (
              <p className="py-6 text-center text-sm text-slate-400">No leads yet.</p>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Phone className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-black text-slate-800">Recent activity</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Logged touches and CRM notes.
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-4">
            {activityViews.length ? activityViews.map((activity) => (
              <div
                key={`${activity.company}-${activity.time}`}
                className="flex gap-4 rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-400" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {activity.company}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      {activity.time}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {activity.type}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {activity.detail}
                  </p>
                </div>
              </div>
            )) : (
              <p className="py-6 text-center text-sm text-slate-400">No recent activity.</p>
            )}
          </div>
        </article>
      </section>
    </InternalShell>
  );
}

function stageHeaderClass(stage: string) {
  const styles: Record<string, string> = {
    New: "border-sky-100 bg-sky-50 text-sky-900",
    Contacted: "border-cyan-100 bg-cyan-50 text-cyan-900",
    Qualified: "border-emerald-100 bg-emerald-50 text-emerald-900",
    Quoted: "border-amber-100 bg-amber-50 text-amber-900",
    Won: "border-lime-100 bg-lime-50 text-lime-900",
    Lost: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return styles[stage] ?? "border-slate-100 bg-white text-slate-900";
}

function stageBadgeClass(stage: string) {
  const map: Record<string, string> = {
    New: "bg-sky-50 text-sky-800",
    Contacted: "bg-cyan-50 text-cyan-800",
    Qualified: "bg-emerald-50 text-emerald-800",
    Quoted: "bg-amber-50 text-amber-800",
    Won: "bg-lime-50 text-lime-800",
    Lost: "bg-slate-100 text-slate-600",
  };
  return map[stage] ?? "bg-slate-100 text-slate-700";
}
