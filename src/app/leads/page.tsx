import {
  Bot,
  CalendarClock,
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
import { getActivityViews, getLeadViews } from "@/lib/crm";
import { leadStages } from "@/lib/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  return (
    <InternalShell
      active="Customers"
      eyebrow="CRM"
      title="Customer pipeline"
      description="The day-one sales desk: who to call, what lane they care about, where they sit in the pipeline, and what the AI thinks should happen next."
      action={{ label: "Instant quote form", href: "/#quote" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Active leads",
            value: leadViews.length.toString(),
            note: "Total working pipeline",
          },
          {
            icon: CalendarClock,
            label: "Follow-ups due",
            value: followUpLeads.length.toString(),
            note: "Start here today",
          },
          {
            icon: Target,
            label: "High priority",
            value: highPriorityCount.toString(),
            note: "Needs tight follow-up",
          },
          {
            icon: TrendingUp,
            label: "Quote-ready",
            value: quoteReadyCount.toString(),
            note: "Qualified or quoted",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-semibold">Today&apos;s calls</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Start with these accounts before opening new work.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {followUpLeads.map((lead, index) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="grid gap-2 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{lead.company}</p>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">
                  #{index + 1}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {lead.nextFollowUp}
              </p>
              <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                {lead.pain}
              </p>
              <span className="mt-1 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Open lead
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Pipeline board
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Move prospects toward booked freight
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Each card should move through a clear sales action: call, qualify,
              quote, or close.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {leadViews.length} leads
          </p>
        </div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="grid min-w-[1260px] grid-cols-6 gap-4">
            {leadStages.map((stage) => {
              const stageLeads = leadViews.filter(
                (lead) => lead.stage === stage,
              );

              return (
                <div
                  key={stage}
                  className="min-h-[300px] rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                      stageHeaderClass(stage),
                    )}
                  >
                    <p className="text-sm font-bold">{stage}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {stageLeads.length ? (
                      stageLeads.map((lead) => (
                        <Link
                          key={lead.company}
                          href={`/leads/${lead.id}`}
                          className="block rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold leading-5">
                                {lead.company}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {lead.contact}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-xs font-semibold",
                                lead.priority === "High"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700",
                              )}
                            >
                              {lead.priority}
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                            {lead.lanes}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              {lead.nextFollowUp}
                            </p>
                            <span className="text-xs font-bold text-emerald-700">
                              Open
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
                        No leads in this stage.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <details className="group rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Create lead</h2>
                <p className="mt-1 leading-7 text-slate-600">
                  Add a prospect manually when they come from a call, referral,
                  outbound list, or savings conversation.
                </p>
              </div>
            </div>
            <span className="flex-none rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white group-open:bg-slate-700">
              <span className="group-open:hidden">Open form</span>
              <span className="hidden group-open:inline">Hide form</span>
            </span>
          </summary>
          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <LeadCreateForm />
          </div>
        </details>

        <details className="group rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileUp className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-2xl font-semibold">Contact import</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Upload CSV contacts when adding a list.
                </p>
              </div>
            </div>
            <span className="flex-none rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white group-open:bg-slate-700">
              <span className="group-open:hidden">Open</span>
              <span className="hidden group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <ContactImportForm />
          </div>
        </details>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">AI sales assistant</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {leadViews.map((lead) => (
              <Link
                key={lead.company}
                href={`/leads/${lead.id}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{lead.company}</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                    {lead.stage}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lead.aiNextAction}
                </p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Recent activity</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {activityViews.map((activity) => (
              <div
                key={`${activity.company}-${activity.time}`}
                className="flex gap-4 rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-emerald-500 shadow-sm shadow-emerald-900/20" />
                <div>
                  <p className="font-semibold">
                    {activity.company}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      {activity.time}
                    </span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {activity.type}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {activity.detail}
                  </p>
                </div>
              </div>
            ))}
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
