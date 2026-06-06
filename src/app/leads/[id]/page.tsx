import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarClock,
  ClipboardList,
  Mail,
  MapPinned,
  Phone,
  Send,
  UserRound,
} from "lucide-react";

import {
  ActivityCreateForm,
  AiAgentRunForm,
  LeadClickToCallForm,
  LeadEmailForm,
  LeadFollowUpCompleteForm,
  LeadSmsForm,
  LeadUpdateForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getLeadDetailView } from "@/lib/crm";

export const dynamic = "force-dynamic";

function stageBadgeClass(stage: string) {
  if (stage === "Won") return "bg-emerald-100 text-emerald-800";
  if (stage === "Quoted") return "bg-sky-100 text-sky-800";
  if (stage === "Qualified") return "bg-violet-100 text-violet-800";
  if (stage === "Contacted") return "bg-amber-100 text-amber-800";
  if (stage === "Lost") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadDetailView(id);

  if (!lead) {
    notFound();
  }

  const outreachPhone = lead.phone === "No phone" ? undefined : lead.phone;
  const outreachEmail = lead.email === "No email" ? undefined : lead.email;
  const defaultSmsMessage = `Hi ${lead.contact}, this is DAO Logistics following up on your freight lanes. Is now a good time to confirm your shipment needs?`;
  const defaultEmailBody = `Hi ${lead.contact},\n\nI wanted to follow up on your freight lanes and see what shipments you need help with next.\n\nThanks,`;

  return (
    <InternalShell
      active="Leads"
      eyebrow="Lead detail"
      title={lead.company}
      description="Work the prospect from one place: contact context, lane notes, stage update, next follow-up, activity logging, and AI suggested next action."
      action={{ label: "Back to Pipeline", href: "/leads" }}
    >
      <Link
        href="/leads"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lead pipeline
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Contact + context card */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{lead.contact}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageBadgeClass(lead.stage)}`}>
              {lead.stage}
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">{lead.title}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <Phone className="h-4 w-4 flex-none text-slate-400" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex gap-3">
                <Mail className="h-4 w-4 flex-none text-slate-400" />
                <span>{lead.email}</span>
              </div>
              <div className="flex gap-3">
                <UserRound className="h-4 w-4 flex-none text-slate-400" />
                <span>Source: {lead.source} · Priority: {lead.priority}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CalendarClock className="h-4 w-4 flex-none text-slate-400" />
                <span>Next follow-up: {lead.nextFollowUp}</span>
                {lead.nextFollowUp !== "No follow-up set" && (
                  <LeadFollowUpCompleteForm
                    leadId={lead.id}
                    currentStage={lead.stage}
                    currentPriority="3"
                  />
                )}
              </div>
            </div>

            <div className="mt-5 rounded-md bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                Lane & freight context
              </div>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                <p><strong className="text-slate-900">Lanes:</strong> {lead.lanes}</p>
                <p><strong className="text-slate-900">Equipment:</strong> {lead.equipment}</p>
                <p><strong className="text-slate-900">Volume:</strong> {lead.volume}</p>
                <p><strong className="text-slate-900">Pain point:</strong> {lead.pain}</p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                  AI next action
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{lead.aiNextAction}</p>
            </div>
          </div>
        </article>

        {/* Action cards */}
        <div className="grid gap-6">
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Bot className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Run AI agent</p>
            </div>
            <div className="p-5">
              <AiAgentRunForm
                relatedEntityType="Lead"
                relatedEntityId={lead.id}
                defaultAgent="Sales Follow-Up Agent"
                agentOptions={["Sales Follow-Up Agent", "Call Notes Agent", "Quote Pricing Agent"]}
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Send className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Outreach</p>
            </div>
            <div className="grid gap-4 p-5 xl:grid-cols-3">
              <LeadClickToCallForm leadId={lead.id} defaultPhone={outreachPhone} />
              <LeadSmsForm
                leadId={lead.id}
                defaultPhone={outreachPhone}
                defaultMessage={defaultSmsMessage}
              />
              <LeadEmailForm
                leadId={lead.id}
                defaultEmail={outreachEmail}
                defaultSubject={`Following up with ${lead.company}`}
                defaultBody={defaultEmailBody}
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Update lead</p>
            </div>
            <div className="p-5">
              <LeadUpdateForm leadId={lead.id} currentStage={lead.stage} />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Activity className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Add activity</p>
            </div>
            <div className="p-5">
              <ActivityCreateForm leadId={lead.id} />
            </div>
          </article>
        </div>
      </section>

      {/* Activity timeline */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Activity timeline</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {lead.activities.length}
          </span>
        </div>
        {lead.activities.length ? (
          <div className="divide-y divide-slate-100">
            {lead.activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.time}-${activity.detail}`}
                className="flex gap-4 px-5 py-4"
              >
                <div className="mt-1.5 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {activity.type}
                    <span className="ml-2 text-xs font-medium text-slate-400">{activity.time}</span>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No activity logged yet.</p>
        )}
      </article>
    </InternalShell>
  );
}
