import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
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

  return (
    <InternalShell
      active="Calls"
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <PhoneCall className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Call record</h2>
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
            <p>From: {call.fromPhone}</p>
            <p>To: {call.toPhone}</p>
            <p>Contact: {call.contact}</p>
            <p>Received: {call.created}</p>
            <p>Recording: {call.recordingStatus}</p>
            <p>Duration: {call.recordingDuration}</p>
            <p>Transcript: {call.transcriptStatus}</p>
            <p>Extraction: {call.extractionStatus}</p>
          </div>
          {call.recordingUrl ? (
            <p className="mt-4 break-all rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              Recording URL: {call.recordingUrl}
            </p>
          ) : null}

          <div className="mt-6 rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Recent customer context
            </p>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
              {call.recentContext.length ? (
                call.recentContext.map((item) => (
                  <p key={item} className="rounded-md bg-slate-50 p-3">
                    {item}
                  </p>
                ))
              ) : (
                <p>No matched customer history yet.</p>
              )}
            </div>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Transcript</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Twilio transcription can populate this automatically for recorded
              voicemail-style intake. For bridged calls, paste the transcript
              here until the full transcription worker is added.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <CallTranscriptForm
                callId={call.id}
                transcriptText={call.transcriptText}
              />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">AI extraction</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Run the Call Intake Agent to turn the transcript and customer
              history into a quote request draft.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <CallExtractionForm callId={call.id} />
            </div>
            {call.aiSummary ? (
              <div className="mt-5 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                <p className="font-semibold">AI summary</p>
                <p className="mt-2">{call.aiSummary}</p>
              </div>
            ) : null}
            {call.missingQuestions.length ? (
              <div className="mt-5 rounded-md border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-semibold">Missing questions</p>
                <div className="mt-2 grid gap-2">
                  {call.missingQuestions.map((question) => (
                    <p key={question}>{question}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-semibold">Review quote draft</h2>
        </div>
        <p className="mt-3 leading-7 text-slate-600">
          Review and correct the AI-filled details before creating the quote
          request. This keeps Grok approval-first.
        </p>
        {call.quoteRequestId ? (
          <Link
            href={`/quote-requests/${call.quoteRequestId}`}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Open created quote request
          </Link>
        ) : (
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <CallQuoteCreateForm
              callId={call.id}
              defaults={call.extractedQuote}
            />
          </div>
        )}
      </section>
    </InternalShell>
  );
}
