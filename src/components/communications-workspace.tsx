"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AtSign,
  Bot,
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
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 xl:grid xl:min-h-[700px] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* Left — inbox */}
      <aside className="border-b border-slate-200 bg-slate-50 xl:border-b-0 xl:border-r">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <MessageSquareText className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Customer inbox</p>
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {workspace.threads.length}
          </span>
        </div>
        <div className="max-h-[620px] overflow-y-auto p-3">
          {workspace.threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={cn(
                "mb-2 w-full rounded-md border p-3 text-left hover:border-emerald-200 hover:bg-white",
                selectedThread.id === thread.id
                  ? "border-slate-900 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50",
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
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {thread.lastMessageTime}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Center — conversation */}
      <article className="grid min-h-[700px] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{selectedThread.company}</p>
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
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Open record
          </Link>
        </div>

        <div className="space-y-3 overflow-y-auto bg-slate-50/70 p-4">
          {selectedThread.messages.length ? (
            [...selectedThread.messages].reverse().map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-lg border p-3 shadow-sm",
                  message.direction === "Outbound"
                    ? "ml-auto border-emerald-100 bg-emerald-50"
                    : message.direction === "Inbound"
                      ? "border-sky-100 bg-sky-50"
                      : "border-slate-200 bg-white",
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
                  <p className="mt-2 text-xs font-medium text-slate-500">{message.outcome}</p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              No messages logged yet. Use the composer below.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {composerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setComposerMode(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold",
                  composerMode === tab.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
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
      <aside className="border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
        {/* Customer context */}
        <div className="overflow-hidden rounded-none border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <AtSign className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Customer context</p>
          </div>
          <dl className="grid gap-3 p-4 text-sm">
            <ContextFact label="Contact" value={selectedThread.contact} />
            <ContextFact label="Phone" value={selectedThread.phone} />
            <ContextFact label="Email" value={selectedThread.email} />
            <ContextFact label="Next follow-up" value={selectedThread.nextFollowUp} />
          </dl>
        </div>

        {/* Sales notes */}
        <div className="overflow-hidden border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <MessageSquareText className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Sales notes</p>
          </div>
          <div className="grid gap-2 p-4 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-900">Lane:</strong> {selectedThread.lanes}</p>
            <p><strong className="text-slate-900">Equipment:</strong> {selectedThread.equipment}</p>
            <p><strong className="text-slate-900">Volume:</strong> {selectedThread.volume}</p>
            <p><strong className="text-slate-900">Pain:</strong> {selectedThread.pain}</p>
          </div>
        </div>

        {/* AI next action */}
        <div className="border-b border-slate-200 p-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                AI next action
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              {selectedThread.aiNextAction}
            </p>
          </div>
        </div>

        {/* AI draft assistant */}
        <div className="border-b border-slate-200 p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                AI draft assistant
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
        </div>

        {/* AI agents */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Run agent</p>
          </div>
          <p className="mb-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
            Conversation notes run automatically after logged calls, emails,
            SMS, and notes.
          </p>
          <AiAgentRunForm
            relatedEntityType="Lead"
            relatedEntityId={selectedThread.leadId}
            defaultAgent="Sales Follow-Up Agent"
            agentOptions={["Sales Follow-Up Agent", "Quote Pricing Agent"]}
          />
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
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
