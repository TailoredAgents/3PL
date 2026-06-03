import { Bot, CalendarClock, FileUp, Phone } from "lucide-react";
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

  return (
    <InternalShell
      active="Leads"
      eyebrow="CRM"
      title="Lead pipeline"
      description="The day-one sales desk: who to call, what lane they care about, where they sit in the pipeline, and what the AI thinks should happen next."
      action={{ label: "Instant quote form", href: "/#quote" }}
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Pipeline board
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Move prospects toward quote requests
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {leadViews.length} leads
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            {leadStages.map((stage) => {
              const stageLeads = leadViews.filter((lead) => lead.stage === stage);

              return (
                <div key={stage} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{stage}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {stageLeads.length ? (
                      stageLeads.map((lead) => (
                        <Link
                          key={lead.company}
                          href={`/leads/${lead.id}`}
                          className="rounded-md border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold leading-6">
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
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {lead.lanes}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {lead.nextFollowUp}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                        No leads in this stage.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileUp className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Contact import</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Import a simple CSV of companies, contacts, phone numbers,
              emails, lanes, and notes.
            </p>
            <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
              <ContactImportForm />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Follow-ups due</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {leadViews.slice(0, 3).map((lead) => (
                <div
                  key={lead.company}
                  className="grid gap-2 rounded-md bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{lead.company}</p>
                    <span className="text-sm font-medium text-slate-600">
                      {lead.nextFollowUp}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {lead.pain}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Create lead</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Add a prospect directly from a call, referral, outbound list, or
          freight savings conversation.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <LeadCreateForm />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">AI sales assistant</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {leadViews.map((lead) => (
              <div key={lead.company} className="rounded-md bg-slate-50 p-4">
                <p className="font-semibold">{lead.company}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lead.aiNextAction}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Recent activity</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {activityViews.map((activity) => (
              <div
                key={`${activity.company}-${activity.time}`}
                className="flex gap-3"
              >
                <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-500" />
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
