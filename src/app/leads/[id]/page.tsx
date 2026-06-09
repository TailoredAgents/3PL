import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPinned,
  Phone,
  Send,
  Target,
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

const panelClass =
  "overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25";
const panelHeaderClass =
  "border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40";

function stageBadgeClass(stage: string) {
  if (stage === "Won") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200";
  }
  if (stage === "Quoted") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200";
  }
  if (stage === "Qualified") {
    return "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200";
  }
  if (stage === "Contacted") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200";
  }
  if (stage === "Lost") {
    return "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function hasValue(value: string, emptyValue: string) {
  return value !== emptyValue && !value.toLowerCase().includes("needed");
}

function getLeadPriority({
  stage,
  nextFollowUp,
  hasPhone,
  hasEmail,
}: {
  stage: string;
  nextFollowUp: string;
  hasPhone: boolean;
  hasEmail: boolean;
}) {
  if (stage === "Won") {
    return {
      icon: CheckCircle2,
      label: "Customer converted",
      detail: "Keep the account file clean and move accepted freight into quote/load workflows.",
      tone:
        "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
    };
  }

  if (nextFollowUp !== "No follow-up set") {
    return {
      icon: CalendarClock,
      label: "Follow-up is scheduled",
      detail: `Next touch is ${nextFollowUp}. Use outreach, log the result, then update stage and next action.`,
      tone:
        "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (!hasPhone && !hasEmail) {
    return {
      icon: UserRound,
      label: "Contact path missing",
      detail: "Add a usable phone number or email before assigning follow-up work to sales or AI agents.",
      tone:
        "border-red-100 bg-red-50 text-red-900 dark:border-red-500/45 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  return {
    icon: Target,
    label: "Qualify the opportunity",
    detail: "Confirm lane frequency, equipment, urgency, pain, and target timing before quoting.",
    tone:
      "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-500/45 dark:bg-sky-950/30 dark:text-sky-100",
  };
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
  const hasPhone = Boolean(outreachPhone);
  const hasEmail = Boolean(outreachEmail);
  const hasLanes = hasValue(lead.lanes, "Lane details needed");
  const leadPriority = getLeadPriority({
    stage: lead.stage,
    nextFollowUp: lead.nextFollowUp,
    hasPhone,
    hasEmail,
  });
  const PriorityIcon = leadPriority.icon;
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
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lead pipeline
      </Link>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
        <div className="grid gap-5">
          <article className={`rounded-lg border p-5 shadow-sm ${leadPriority.tone}`}>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
                <PriorityIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                  Sales priority
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{leadPriority.label}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                  {leadPriority.detail}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <ReadinessChip label="Phone" value={hasPhone ? "Ready" : "Missing"} ready={hasPhone} />
                  <ReadinessChip label="Email" value={hasEmail ? "Ready" : "Missing"} ready={hasEmail} />
                  <ReadinessChip label="Lane context" value={hasLanes ? "Ready" : "Needed"} ready={hasLanes} />
                </div>
              </div>
            </div>
          </article>

          <article className={panelClass}>
          <div className={`flex items-center justify-between ${panelHeaderClass}`}>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800">{lead.contact}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stageBadgeClass(lead.stage)}`}>
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

            <div className="mt-5 rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/55">
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

            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/45 dark:bg-emerald-950/35">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                  AI next action
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-100">{lead.aiNextAction}</p>
            </div>
          </div>
          </article>
        </div>

        <div className="grid gap-6">
          <article className={panelClass}>
            <div className={`flex items-center gap-2 ${panelHeaderClass}`}>
              <Bot className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800">AI sales support</p>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/35 dark:text-emerald-100">
                <p className="text-xs font-black uppercase tracking-[0.16em]">Agent target</p>
                <p className="mt-2 text-sm font-semibold leading-6">
                  Use sales follow-up for relationship touches or quote pricing when the lane is ready to price.
                </p>
              </div>
              <AiAgentRunForm
                relatedEntityType="Lead"
                relatedEntityId={lead.id}
                defaultAgent="Sales Follow-Up Agent"
                agentOptions={["Sales Follow-Up Agent", "Quote Pricing Agent"]}
              />
            </div>
          </article>

          <article className={panelClass}>
            <div className={`flex items-center gap-2 ${panelHeaderClass}`}>
              <Send className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800">Outreach workspace</p>
            </div>
            <div className="grid gap-4 p-5 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                <LeadClickToCallForm leadId={lead.id} defaultPhone={outreachPhone} />
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                <LeadSmsForm
                  leadId={lead.id}
                  defaultPhone={outreachPhone}
                  defaultMessage={defaultSmsMessage}
                />
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45 xl:col-span-2">
                <LeadEmailForm
                  leadId={lead.id}
                  defaultEmail={outreachEmail}
                  defaultSubject={`Following up with ${lead.company}`}
                  defaultBody={defaultEmailBody}
                />
              </div>
            </div>
          </article>

          <details className={`group ${panelClass}`}>
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 ${panelHeaderClass} px-5 py-4`}>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-black text-slate-800">Update lead</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    Stage, priority, follow-up, and next action.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400 group-open:hidden">Expand</span>
              <span className="hidden text-xs font-black text-slate-400 group-open:inline">Collapse</span>
            </summary>
            <div className="p-5">
              <LeadUpdateForm leadId={lead.id} currentStage={lead.stage} />
            </div>
          </details>

          <details className={`group ${panelClass}`}>
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 ${panelHeaderClass} px-5 py-4`}>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-black text-slate-800">Add activity</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    Log calls, emails, SMS, notes, meetings, and outcomes.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400 group-open:hidden">Expand</span>
              <span className="hidden text-xs font-black text-slate-400 group-open:inline">Collapse</span>
            </summary>
            <div className="p-5">
              <ActivityCreateForm leadId={lead.id} />
            </div>
          </details>
        </div>
      </section>

      <article className={panelClass}>
        <div className={`flex items-center justify-between ${panelHeaderClass}`}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800">Activity timeline</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {lead.activities.length}
          </span>
        </div>
        {lead.activities.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
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

function ReadinessChip({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className={`mt-1 text-sm font-black ${ready ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"}`}>
        {value}
      </p>
    </div>
  );
}
