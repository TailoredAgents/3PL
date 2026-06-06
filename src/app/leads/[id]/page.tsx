import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Mail,
  MapPinned,
  Phone,
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
      active="Customers"
      eyebrow="Lead detail"
      title={lead.company}
      description="Work the prospect from one place: contact context, lane notes, stage update, next follow-up, activity logging, and AI suggested next action."
      action={{ label: "Back to Customers", href: "/customers" }}
    >
      <Link
        href="/leads"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lead pipeline
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{lead.contact}</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {lead.title}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {lead.stage}
            </span>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <Phone className="h-5 w-5 flex-none text-slate-400" />
              <span>{lead.phone}</span>
            </div>
            <div className="flex gap-3">
              <Mail className="h-5 w-5 flex-none text-slate-400" />
              <span>{lead.email}</span>
            </div>
            <div className="flex gap-3">
              <UserRound className="h-5 w-5 flex-none text-slate-400" />
              <span>
                Source: {lead.source} | Priority: {lead.priority}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CalendarClock className="h-5 w-5 flex-none text-slate-400" />
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

          <div className="mt-6 rounded-md bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPinned className="h-4 w-4 text-emerald-600" />
              Lane and freight context
            </div>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
              <p>
                <strong className="text-slate-950">Lanes:</strong> {lead.lanes}
              </p>
              <p>
                <strong className="text-slate-950">Equipment:</strong>{" "}
                {lead.equipment}
              </p>
              <p>
                <strong className="text-slate-950">Volume:</strong> {lead.volume}
              </p>
              <p>
                <strong className="text-slate-950">Pain point:</strong>{" "}
                {lead.pain}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-semibold text-emerald-900">
                AI suggested next action
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              {lead.aiNextAction}
            </p>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Run sales agent</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Generate an approval-first sales recommendation from the current
              lead context. The run is logged for review.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <AiAgentRunForm
                relatedEntityType="Lead"
                relatedEntityId={lead.id}
                defaultAgent="Sales Follow-Up Agent"
                agentOptions={["Sales Follow-Up Agent"]}
              />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Outreach</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Start a recorded click-to-call, send an SMS follow-up, or send a
              customer email. Each action is logged to this lead&apos;s activity
              timeline.
            </p>
            <div className="mt-5 grid gap-4 rounded-lg bg-slate-50 p-4 xl:grid-cols-3">
              <LeadClickToCallForm
                leadId={lead.id}
                defaultPhone={outreachPhone}
              />
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

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Update lead</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Change stage, priority, follow-up date, and next action after each
              call or email.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <LeadUpdateForm leadId={lead.id} currentStage={lead.stage} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Add activity</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Log calls, emails, texts, meetings, notes, or AI touches.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <ActivityCreateForm leadId={lead.id} />
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Activity timeline</h2>
        <div className="mt-5 grid gap-4">
          {lead.activities.length ? (
            lead.activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.time}-${activity.detail}`}
                className="flex gap-3"
              >
                <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                <div>
                  <p className="font-semibold">
                    {activity.type}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      {activity.time}
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {activity.detail}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              No activity yet.
            </p>
          )}
        </div>
      </section>
    </InternalShell>
  );
}
