import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Bot,
  ClipboardCheck,
  FileText,
  PhoneCall,
  Radio,
  Settings2,
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
  const callWork = needsTranscript + needsExtraction + needsReview;
  const callPosture =
    calls.length === 0
      ? {
          label: "No call traffic captured yet",
          body: "Connect Twilio inbound voice to start recording, transcribing, and extracting shipment details from phone conversations.",
          className: "border-slate-200 bg-white text-slate-950",
          icon: Settings2,
        }
      : callWork > 0
        ? {
            label: "Call work needs review",
            body: `${callWork} recorded call tasks need transcript, extraction, or broker approval before they are ready for quote creation.`,
            className: "border-amber-200 bg-amber-50 text-amber-950",
            icon: AlertTriangle,
          }
        : {
            label: "Call queue is clean",
            body: "Recorded calls are transcribed, extracted, and reviewed for the current queue.",
            className: "border-emerald-200 bg-emerald-50 text-emerald-950",
            icon: CheckCircle2,
          };
  const CallPostureIcon = callPosture.icon;

  const summaryCards = [
    { icon: PhoneCall, label: "Calls", value: calls.length.toString() },
    {
      icon: FileText,
      label: "Needs transcript",
      value: needsTranscript.toString(),
    },
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
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                {card.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        className={`rounded-lg border p-5 shadow-sm ${callPosture.className}`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <CallPostureIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
                Call automation priority
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {callPosture.label}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                {callPosture.body}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-white/70 bg-white/70 p-3 text-slate-700 sm:grid-cols-3 lg:grid-cols-1">
            <CallStep
              label="Record"
              value={`${calls.length} calls`}
              icon={<PhoneCall className="h-3.5 w-3.5 text-sky-700" />}
            />
            <CallStep
              label="Transcribe"
              value={`${needsTranscript} waiting`}
              icon={<FileText className="h-3.5 w-3.5 text-amber-700" />}
            />
            <CallStep
              label="Approve"
              value={`${needsReview} reviews`}
              icon={<ClipboardCheck className="h-3.5 w-3.5 text-emerald-700" />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        {calls.length ? (
          calls.map((call) => (
            <article
              key={call.id}
              className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-700">
                    {call.shipper}
                  </p>
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
            <div className="p-10 text-center">
              <PhoneCall className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-lg font-bold text-slate-800">
                No calls have been recorded yet
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Configure your Twilio number to send inbound voice webhooks to{" "}
                <code className="rounded bg-slate-100 px-1">
                  /api/twilio/voice/incoming
                </code>
                . Once calls arrive, this queue will show transcript, extraction,
                and review status.
              </p>
              <Link
                href="/settings"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800"
              >
                Open Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

function CallStep({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
