import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  PhoneCall,
} from "lucide-react";

import {
  CallExtractionForm,
  CallQuoteCreateForm,
  CallTranscriptForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getCallDetailView } from "@/lib/calls";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getCallDetailView(id);

  if (!call) {
    notFound();
  }

  const quoteReady =
    call.transcriptStatus === "Completed" &&
    call.extractionStatus !== "Not Started" &&
    Boolean(call.aiSummary || call.quoteRequestId);
  const blockers = [
    call.transcriptStatus !== "Completed" ? "transcript" : null,
    call.extractionStatus === "Not Started" ? "AI extraction" : null,
    call.missingQuestions.length ? "missing shipment questions" : null,
    !call.aiSummary && !call.quoteRequestId ? "quote draft review" : null,
  ].filter(Boolean);

  return (
    <InternalShell
      active="Communications"
      eyebrow="Call detail"
      title={call.shipper}
      description="Review the recording, transcript, AI intake extraction, and create a quote request only after a human review."
      action={{ label: "Back to calls", href: "/calls" }}
    >
      <Link
        href="/calls"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to call queue
      </Link>

      <section
        className={`rounded-lg border p-5 shadow-sm ${
          quoteReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              {quoteReady ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
                Intake readiness
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {quoteReady
                  ? "Call is ready for quote review"
                  : "Finish intake before quoting"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                {quoteReady
                  ? "Transcript and AI intake work are far enough along for a broker to review the quote draft."
                  : `Resolve ${blockers.join(", ")} before creating a customer-facing quote request from this call.`}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-white/70 bg-white/70 p-3 text-slate-700">
            <CallReadinessItem
              label="Transcript"
              value={call.transcriptStatus}
            />
            <CallReadinessItem
              label="Extraction"
              value={call.extractionStatus}
            />
            <CallReadinessItem
              label="Quote draft"
              value={call.quoteRequestId ? "Created" : "Not created"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Call record */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <PhoneCall className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Call record</p>
          </div>
          <div className="p-5">
            <div className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              <CallFact label="From" value={call.fromPhone} />
              <CallFact label="To" value={call.toPhone} />
              <CallFact label="Contact" value={call.contact} />
              <CallFact label="Received" value={call.created} />
              <CallFact label="Recording" value={call.recordingStatus} />
              <CallFact label="Duration" value={call.recordingDuration} />
              <CallFact label="Transcript" value={call.transcriptStatus} />
              <CallFact label="Extraction" value={call.extractionStatus} />
            </div>
            {call.recordingUrl ? (
              <p className="mt-4 break-all rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                Recording URL: {call.recordingUrl}
              </p>
            ) : null}

            <div className="mt-5 rounded-md border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Recent customer context
              </p>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                {call.recentContext.length ? (
                  call.recentContext.map((item) => (
                    <p key={item} className="rounded-md bg-white px-3 py-2">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400">No matched customer history yet.</p>
                )}
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-6">
          {/* Transcript */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <FileText className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Transcript</p>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-slate-500">
                Twilio transcription can populate this automatically for recorded
                voicemail-style intake. For bridged calls, paste the transcript
                here until the full transcription worker is added.
              </p>
              <div className="mt-4">
                <CallTranscriptForm
                  callId={call.id}
                  transcriptText={call.transcriptText}
                />
              </div>
            </div>
          </article>

          {/* AI extraction */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Bot className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">AI extraction</p>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-slate-500">
                Run the Call Intake Agent to turn the transcript and customer
                history into a quote request draft.
              </p>
              <div className="mt-4">
                <CallExtractionForm callId={call.id} />
              </div>
              {call.aiSummary ? (
                <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  <p className="font-semibold">AI summary</p>
                  <p className="mt-2">{call.aiSummary}</p>
                </div>
              ) : null}
              {call.missingQuestions.length ? (
                <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  <p className="font-semibold">Missing questions</p>
                  <div className="mt-2 grid gap-2">
                    {call.missingQuestions.map((question) => (
                      <p key={question}>{question}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      {/* Review quote draft */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Review quote draft</p>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-500">
            Review and correct the AI-filled details before creating the quote
            request. This keeps Grok approval-first.
          </p>
          {call.quoteRequestId ? (
            <Link
              href={`/quote-requests/${call.quoteRequestId}`}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Open created quote request
            </Link>
          ) : (
            <div className="mt-4">
              <CallQuoteCreateForm
                callId={call.id}
                defaults={call.extractedQuote}
              />
            </div>
          )}
        </div>
      </article>
    </InternalShell>
  );
}

function CallReadinessItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

function CallFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
