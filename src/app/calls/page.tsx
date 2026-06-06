import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileText,
  PhoneCall,
  Radio,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getCallViews } from "@/lib/calls";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
  { border: "border-l-[3px] border-l-red-400", icon: "bg-red-50 text-red-700" },
] as const;

export default async function CallsPage() {
  const calls = await getCallViews();
  const needsTranscript = calls.filter(
    (call) => call.transcriptStatus !== "Completed",
  ).length;
  const needsExtraction = calls.filter(
    (call) =>
      call.transcriptStatus === "Completed" &&
      call.extractionStatus === "Not Started",
  ).length;
  const needsReview = calls.filter(
    (call) => call.extractionStatus === "Needs Review",
  ).length;

  const summaryCards = [
    { icon: PhoneCall, label: "Calls", value: calls.length.toString() },
    { icon: FileText, label: "Needs transcript", value: needsTranscript.toString() },
    { icon: Bot, label: "Needs extraction", value: needsExtraction.toString() },
    { icon: Radio, label: "Needs review", value: needsReview.toString() },
  ];

  return (
    <InternalShell
      active="Communications"
      eyebrow="Call intelligence"
      title="Call intake queue"
      description="Review recorded shipment calls, transcripts, AI extraction, and approved quote request drafts."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card, i) => (
          <article
            key={card.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{card.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5">
        {calls.length ? (
          calls.map((call) => (
            <article
              key={call.id}
              className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">{call.shipper}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {call.status}
                  </span>
                  <Link
                    href={`/calls/${call.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Open call
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-slate-500">
                  {call.fromPhone} → {call.toPhone} · {call.contact}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{call.aiSummary}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <CallMetric label="Recording" value={call.recordingStatus} />
                  <CallMetric label="Transcript" value={call.transcriptStatus} />
                  <CallMetric label="Extraction" value={call.extractionStatus} />
                  <CallMetric label="Received" value={call.created} />
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <p className="p-8 text-center text-sm text-slate-400">
              No calls have been recorded yet. Configure your Twilio number to
              send inbound voice webhooks to <code className="rounded bg-slate-100 px-1">/api/twilio/voice/incoming</code>.
            </p>
          </div>
        )}
      </section>
    </InternalShell>
  );
}

function CallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
