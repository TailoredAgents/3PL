"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AtSign,
  FileText,
  Mail,
  MessageSquareText,
  PhoneCall,
  Send,
} from "lucide-react";

import {
  LeadClickToCallForm,
  LeadEmailForm,
  LeadNoteForm,
  LeadSmsForm,
} from "@/components/crm-forms";
import type {
  CommunicationWorkspaceView,
} from "@/lib/crm";
import { cn } from "@/lib/utils";

type ComposerMode = "sms" | "email" | "call" | "note";

const composerTabs: { id: ComposerMode; label: string; icon: typeof Send }[] = [
  { id: "sms", label: "SMS", icon: Send },
  { id: "email", label: "Email", icon: Mail },
  { id: "call", label: "Call", icon: PhoneCall },
  { id: "note", label: "Note", icon: FileText },
];

export function CommunicationsWorkspace({
  workspace,
}: {
  workspace: CommunicationWorkspaceView;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState(
    workspace.threads[0]?.id ?? "",
  );
  const [composerMode, setComposerMode] = useState<ComposerMode>("sms");
  const selectedThread = useMemo(
    () =>
      workspace.threads.find((thread) => thread.id === selectedThreadId) ??
      workspace.threads[0],
    [selectedThreadId, workspace.threads],
  );

  if (!workspace.threads.length || !selectedThread) {
    return (
      <section className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
        No customer conversations are available yet. Create a customer lead to
        start calling, texting, emailing, and logging notes.
      </section>
    );
  }

  return (
    <section className="grid min-h-[720px] overflow-hidden rounded-lg border border-white bg-white shadow-lg shadow-slate-950/5 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
      <aside className="border-b border-slate-200 bg-slate-50 xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Conversations
          </p>
          <h2 className="mt-2 text-xl font-semibold">Customer inbox</h2>
        </div>
        <div className="max-h-[660px] overflow-y-auto p-3">
          {workspace.threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={cn(
                "mb-2 w-full rounded-md border p-4 text-left hover:border-emerald-200 hover:bg-white",
                selectedThread.id === thread.id
                  ? "border-slate-950 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {thread.company}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {thread.contact}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                  {thread.priority}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {thread.lastMessage}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                {thread.lastMessageTime}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <article className="grid min-h-[720px] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                {selectedThread.stage} customer
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {selectedThread.company}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedThread.contact} | {selectedThread.title}
              </p>
            </div>
            <Link
              href={`/leads/${selectedThread.leadId}`}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open record
            </Link>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto bg-slate-50/70 p-5">
          {selectedThread.messages.length ? (
            [...selectedThread.messages].reverse().map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[82%] rounded-lg border p-4 shadow-sm",
                  message.direction === "Outbound"
                    ? "ml-auto border-emerald-100 bg-emerald-50"
                    : message.direction === "Inbound"
                      ? "border-sky-100 bg-sky-50"
                      : "border-slate-200 bg-white",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      channelClass(message.channel),
                    )}
                  >
                    {message.channel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {message.direction}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {message.time}
                  </span>
                </div>
                <p className="mt-3 font-semibold text-slate-950">
                  {message.subject}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {message.body}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {message.outcome}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
              No messages are logged for this customer yet. Use the composer
              below to call, text, email, or add an internal note.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {composerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setComposerMode(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
                  composerMode === tab.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {composerMode === "sms" ? (
            <LeadSmsForm
              leadId={selectedThread.leadId}
              defaultPhone={cleanValue(selectedThread.phone)}
              defaultMessage={`Hi ${selectedThread.contact}, this is Atlanta Freight OS following up on your freight lanes. Is now a good time to confirm what you need moved next?`}
            />
          ) : null}
          {composerMode === "email" ? (
            <LeadEmailForm
              leadId={selectedThread.leadId}
              defaultEmail={cleanValue(selectedThread.email)}
              defaultSubject={`Following up with ${selectedThread.company}`}
              defaultBody={`Hi ${selectedThread.contact},\n\nI wanted to follow up on your freight lanes and see what shipments you need help with next.\n\nThanks,`}
            />
          ) : null}
          {composerMode === "call" ? (
            <LeadClickToCallForm
              leadId={selectedThread.leadId}
              defaultPhone={cleanValue(selectedThread.phone)}
            />
          ) : null}
          {composerMode === "note" ? (
            <LeadNoteForm leadId={selectedThread.leadId} />
          ) : null}
        </div>
      </article>

      <aside className="border-t border-slate-200 bg-slate-50 p-5 xl:border-l xl:border-t-0">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <AtSign className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Customer context</h2>
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <ContextFact label="Contact" value={selectedThread.contact} />
            <ContextFact label="Phone" value={selectedThread.phone} />
            <ContextFact label="Email" value={selectedThread.email} />
            <ContextFact label="Next follow-up" value={selectedThread.nextFollowUp} />
          </dl>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Sales notes</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <p>
              <strong className="text-slate-950">Lane:</strong>{" "}
              {selectedThread.lanes}
            </p>
            <p>
              <strong className="text-slate-950">Equipment:</strong>{" "}
              {selectedThread.equipment}
            </p>
            <p>
              <strong className="text-slate-950">Volume:</strong>{" "}
              {selectedThread.volume}
            </p>
            <p>
              <strong className="text-slate-950">Pain:</strong>{" "}
              {selectedThread.pain}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            AI next action
          </p>
          <p className="mt-3 text-sm leading-6 text-emerald-950">
            {selectedThread.aiNextAction}
          </p>
        </div>
      </aside>
    </section>
  );
}

function ContextFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function channelClass(channel: string) {
  if (channel === "Sms") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (channel === "Email") {
    return "bg-sky-100 text-sky-800";
  }

  if (channel === "Call") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

function cleanValue(value: string) {
  if (value.startsWith("No ")) {
    return undefined;
  }

  return value;
}
