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

  return (
    <InternalShell
      active="Communications"
      eyebrow="Call intelligence"
      title="Call intake queue"
      description="Review recorded shipment calls, transcripts, AI extraction, and approved quote request drafts."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { icon: PhoneCall, label: "Calls", value: calls.length.toString() },
          {
            icon: FileText,
            label: "Needs transcript",
            value: needsTranscript.toString(),
          },
          {
            icon: Bot,
            label: "Needs extraction",
            value: needsExtraction.toString(),
          },
          {
            icon: Radio,
            label: "Needs review",
            value: needsReview.toString(),
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <item.icon className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5">
        {calls.length ? (
          calls.map((call) => (
            <article
              key={call.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{call.shipper}</h2>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                      {call.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {call.fromPhone} {"->"} {call.toPhone} | {call.contact}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {call.aiSummary}
                  </p>
                </div>
                <Link
                  href={`/calls/${call.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Open call
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <CallMetric label="Recording" value={call.recordingStatus} />
                <CallMetric label="Transcript" value={call.transcriptStatus} />
                <CallMetric label="Extraction" value={call.extractionStatus} />
                <CallMetric label="Received" value={call.created} />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
            No calls have been recorded yet. Configure your Twilio number to
            send inbound voice webhooks to `/api/twilio/voice/incoming`.
          </div>
        )}
      </section>
    </InternalShell>
  );
}

function CallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
