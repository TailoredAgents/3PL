"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  AtSign,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquareText,
  PhoneCall,
  Receipt,
  Send,
} from "lucide-react";

import {
  AiAgentRunForm,
  LeadClickToCallForm,
  LeadEmailForm,
  LeadNoteForm,
  LeadSmsForm,
  QuickQuoteForm,
} from "@/components/crm-forms";
import type { CommunicationWorkspaceView } from "@/lib/crm";
import { cn } from "@/lib/utils";

type ComposerMode = "sms" | "email" | "call" | "note" | "quote";
type DraftChannel = "email" | "sms";
type DraftPurpose = "sales_follow_up" | "quote_follow_up" | "no_response_check_in";
type CommunicationDraft = {
  channel: DraftChannel;
  purpose: DraftPurpose;
  subject: string;
  body: string;
  summary: string;
  confidence: number;
  nextAction: string;
  runId?: string;
};
type DraftState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

const composerTabs: { id: ComposerMode; label: string; icon: typeof Send }[] = [
  { id: "sms", label: "SMS", icon: Send },
  { id: "email", label: "Email", icon: Mail },
  { id: "call", label: "Call", icon: PhoneCall },
  { id: "note", label: "Note", icon: FileText },
  { id: "quote", label: "Quote", icon: Receipt },
];

function priorityBadgeClass(priority: string) {
  if (priority === "High") return "bg-amber-100 text-amber-800";
  if (priority === "Medium") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

export function CommunicationsWorkspace({
  workspace,
}: {
  workspace: CommunicationWorkspaceView;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState(
    workspace.threads[0]?.id ?? "",
  );
  const [composerMode, setComposerMode] = useState<ComposerMode>("sms");
  const [drafts, setDrafts] = useState<Record<string, CommunicationDraft>>({});
  const [draftState, setDraftState] = useState<DraftState>({ status: "idle" });
  const selectedThread = useMemo(
    () =>
      workspace.threads.find((thread) => thread.id === selectedThreadId) ??
      workspace.threads[0],
    [selectedThreadId, workspace.threads],
  );
  const activeDraft =
    composerMode === "email" || composerMode === "sms"
      ? drafts[getDraftKey(selectedThread?.leadId ?? "", composerMode)]
      : undefined;
  const latestMessage = selectedThread?.messages[0];

  async function requestDraft(channel: DraftChannel, purpose: DraftPurpose) {
    if (!selectedThread) {
      return;
    }

    setDraftState({ status: "loading", message: "Drafting..." });

    try {
      const formData = new FormData();
      formData.set("channel", channel);
      formData.set("purpose", purpose);
      const response = await fetch(
        `/api/leads/${selectedThread.leadId}/communication-draft`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        draft?: CommunicationDraft;
      };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Unable to create AI draft.");
      }

      setDrafts((current) => ({
        ...current,
        [getDraftKey(selectedThread.leadId, channel)]: payload.draft as CommunicationDraft,
      }));
      setDraftState({
        status: "success",
        message: payload.message ?? "AI draft created.",
      });
      setComposerMode(channel);
    } catch (error) {
      setDraftState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to create AI draft.",
      });
    }
  }

  if (!workspace.threads.length || !selectedThread) {
    return (
      <section className="rounded-lg border border-slate-100 bg-white p-8 text-center shadow-md shadow-slate-950/5">
        <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-600">No conversations yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Create a lead to start calling, texting, emailing, and logging notes.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/25 xl:grid xl:h-[calc(100vh-13rem)] xl:min-h-[720px] xl:max-h-[920px] xl:grid-cols-[310px_minmax(0,1fr)_320px]">
      {/* Left — inbox */}
      <aside className="grid max-h-[380px] grid-rows-[auto_minmax(0,1fr)] border-b border-slate-200 bg-slate-50/80 xl:max-h-none xl:min-h-0 xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-slate-900">Customer inbox</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {workspace.threads.length}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Prioritized conversations, follow-ups, and quote-ready sales work.
          </p>
        </div>
        <div className="min-h-0 space-y-2 overflow-y-auto p-4">
          {workspace.threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md dark:hover:border-emerald-700 dark:hover:bg-slate-950",
                selectedThread.id === thread.id
                  ? "border-slate-900 bg-white shadow-md shadow-slate-950/10 ring-1 ring-slate-900/5 dark:border-emerald-500 dark:bg-slate-950 dark:ring-emerald-500/20"
                  : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {thread.company}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{thread.contact}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", priorityBadgeClass(thread.priority))}>
                  {thread.priority}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                {thread.lastMessage}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <Clock className="h-3 w-3" />
                  {thread.lastMessageTime}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {thread.stage}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Center — conversation */}
      <article className="grid h-[calc(100vh-8rem)] min-h-[560px] max-h-[760px] grid-rows-[auto_auto_minmax(140px,1fr)_minmax(230px,auto)] xl:h-auto xl:min-h-0 xl:max-h-none xl:grid-rows-[auto_auto_minmax(180px,1fr)_minmax(250px,auto)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-slate-950">{selectedThread.company}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {selectedThread.stage}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {selectedThread.contact} · {selectedThread.title}
            </p>
          </div>
          <Link
            href={`/leads/${selectedThread.leadId}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-700"
          >
            Open record <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-stretch">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-700" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                  Next best action
                </p>
              </div>
              <p className="mt-1 text-sm leading-6 text-emerald-950">
                {selectedThread.aiNextAction}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <ThreadStat label="Priority" value={selectedThread.priority} />
              <ThreadStat label="Messages" value={selectedThread.messages.length.toString()} />
              <ThreadStat label="Last touch" value={latestMessage?.time ?? "None"} />
            </div>
          </div>
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef5f2_100%)] p-5 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
          {selectedThread.messages.length ? (
            [...selectedThread.messages].reverse().map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[86%] rounded-lg border p-4 shadow-sm",
                  message.direction === "Outbound"
                    ? "ml-auto border-emerald-100 bg-emerald-50"
                    : message.direction === "Inbound"
                      ? "border-sky-100 bg-sky-50"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", channelClass(message.channel))}>
                    {message.channel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {message.direction}
                  </span>
                  <span className="text-xs text-slate-400">{message.time}</span>
                </div>
                {message.subject && (
                  <p className="mt-2 text-sm font-semibold text-slate-900">{message.subject}</p>
                )}
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {message.body}
                </p>
                {message.outcome && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="h-3 w-3" />
                    {message.outcome}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                No messages logged yet
              </p>
              <p className="mt-1">Use SMS, email, call, note, or quote below.</p>
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Compose next touch
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Sending to {selectedThread.contact} at {composerMode === "email" ? selectedThread.email : selectedThread.phone}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {composerTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setComposerMode(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold",
                    composerMode === tab.id
                      ? "border-slate-900 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:text-emerald-300",
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {composerMode === "sms" && (
            <LeadSmsForm
              key={`sms-${selectedThread.leadId}-${activeDraft?.runId ?? "base"}`}
              leadId={selectedThread.leadId}
              defaultPhone={cleanValue(selectedThread.phone)}
              defaultMessage={
                activeDraft?.channel === "sms"
                  ? activeDraft.body
                  : `Hi ${selectedThread.contact}, this is DAO Logistics following up on your freight lanes. Is now a good time to confirm what you need moved next?`
              }
            />
          )}
          {composerMode === "email" && (
            <LeadEmailForm
              key={`email-${selectedThread.leadId}-${activeDraft?.runId ?? "base"}`}
              leadId={selectedThread.leadId}
              defaultEmail={cleanValue(selectedThread.email)}
              defaultSubject={
                activeDraft?.channel === "email"
                  ? activeDraft.subject
                  : `Following up with ${selectedThread.company}`
              }
              defaultBody={
                activeDraft?.channel === "email"
                  ? activeDraft.body
                  : `Hi ${selectedThread.contact},\n\nI wanted to follow up on your freight lanes and see what shipments you need help with next.\n\nThanks,`
              }
            />
          )}
          {composerMode === "call" && (
            <LeadClickToCallForm
              leadId={selectedThread.leadId}
              defaultPhone={cleanValue(selectedThread.phone)}
            />
          )}
          {composerMode === "note" && (
            <LeadNoteForm leadId={selectedThread.leadId} />
          )}
          {composerMode === "quote" && (
            <QuickQuoteForm
              leadId={selectedThread.leadId}
              companyName={selectedThread.company}
              contactName={cleanValue(selectedThread.contact)}
            />
          )}
        </div>
      </article>

      {/* Right — context sidebar */}
      <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
        {/* Customer context */}
        <div className="overflow-hidden rounded-none border-b border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-slate-900">Customer intelligence</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Current contact, relationship context, and follow-up timing.
            </p>
          </div>
          <dl className="grid gap-3 p-4 text-sm">
            <ContextFact label="Contact" value={selectedThread.contact} />
            <ContextFact label="Phone" value={selectedThread.phone} />
            <ContextFact label="Email" value={selectedThread.email} />
            <ContextFact label="Next follow-up" value={selectedThread.nextFollowUp} />
          </dl>
        </div>

        {/* AI actions */}
        <div className="border-b border-slate-200 p-4">
          <div className="grid gap-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-900 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Auto notes
                </p>
              </div>
              <p className="mt-2 text-xs leading-5">
                Conversation notes update automatically after logged calls,
                emails, SMS, and notes.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Draft next message
              </p>
            </div>
              <div className="mt-3 grid gap-2">
                <DraftButton
                  label="Follow-up email"
                  loading={draftState.status === "loading"}
                  onClick={() => requestDraft("email", "sales_follow_up")}
                />
                <DraftButton
                  label="Follow-up SMS"
                  loading={draftState.status === "loading"}
                  onClick={() => requestDraft("sms", "sales_follow_up")}
                />
                <DraftButton
                  label="Quote follow-up"
                  loading={draftState.status === "loading"}
                  onClick={() => requestDraft("email", "quote_follow_up")}
                />
                <DraftButton
                  label="No-response check-in"
                  loading={draftState.status === "loading"}
                  onClick={() => requestDraft("email", "no_response_check_in")}
                />
              </div>

            {draftState.message ? (
              <p className={cn(
                "mt-3 rounded-md px-3 py-2 text-xs leading-5",
                draftState.status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-800",
              )}>
                {draftState.message}
              </p>
            ) : null}
            {activeDraft ? (
              <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">
                <p className="font-semibold">Latest draft</p>
                <p className="mt-1">{activeDraft.summary}</p>
                <p className="mt-1 font-semibold">
                  Confidence {Math.round(activeDraft.confidence * 100)}%
                </p>
                <p className="mt-1">{activeDraft.nextAction}</p>
              </div>
            ) : null}
            {selectedThread.latestAiDraft ? (
              <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <p className="font-semibold text-slate-900">Saved AI draft</p>
                <p className="mt-1">
                  {selectedThread.latestAiDraft.channel} · {selectedThread.latestAiDraft.purpose} · {selectedThread.latestAiDraft.status}
                </p>
                <p className="mt-1">{selectedThread.latestAiDraft.summary}</p>
                <p className="mt-1 font-semibold text-slate-700">
                  {selectedThread.latestAiDraft.created}
                  {selectedThread.latestAiDraft.confidence === null
                    ? ""
                    : ` · ${Math.round(selectedThread.latestAiDraft.confidence * 100)}% confidence`}
                </p>
              </div>
            ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Run agent
              </p>
              <div className="mt-2">
                <AiAgentRunForm
                  relatedEntityType="Lead"
                  relatedEntityId={selectedThread.leadId}
                  defaultAgent="Sales Follow-Up Agent"
                  agentOptions={["Sales Follow-Up Agent", "Quote Pricing Agent"]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales notes */}
        <div className="overflow-hidden border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <MessageSquareText className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-900">Account facts</p>
          </div>
          <div className="grid gap-2 p-4 text-sm leading-6 text-slate-600">
            <SidebarFact label="Lane" value={selectedThread.lanes} />
            <SidebarFact label="Equipment" value={selectedThread.equipment} />
            <SidebarFact label="Volume" value={selectedThread.volume} />
            <SidebarFact label="Pain" value={selectedThread.pain} />
          </div>
        </div>
      </aside>
    </section>
  );
}

function DraftButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
    >
      <Bot className="h-3.5 w-3.5" />
      {loading ? "Drafting..." : label}
    </button>
  );
}

function getDraftKey(leadId: string, channel: DraftChannel) {
  return `${leadId}:${channel}`;
}

function ContextFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function ThreadStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SidebarFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function channelClass(channel: string) {
  if (channel === "Sms") return "bg-emerald-100 text-emerald-800";
  if (channel === "Email") return "bg-sky-100 text-sky-800";
  if (channel === "Call") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function cleanValue(value: string) {
  if (value.startsWith("No ")) return undefined;
  return value;
}
