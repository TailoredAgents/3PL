import {
  Bot,
  ClipboardList,
  FileText,
  Headphones,
  MapPinned,
  ReceiptText,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getDashboardMetrics } from "@/lib/crm";
import { agentBriefs } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const dashboardCards = [
    {
      icon: Headphones,
      label: "Leads needing follow-up",
      value: metrics.leadsDue,
      note: "Call qualified leads and new audit submissions first.",
    },
    {
      icon: FileText,
      label: "Open quote requests",
      value: metrics.openQuotes,
      note: "Review service details before rate work starts.",
    },
    {
      icon: MapPinned,
      label: "Active loads",
      value: metrics.activeLoads,
      note: "Watch pickup, delivery, POD, and customer update needs.",
    },
    {
      icon: ReceiptText,
      label: "Projected margin",
      value: metrics.projectedMargin,
      note: "Business margin from loads with carrier costs entered.",
    },
  ];

  return (
    <InternalShell
      active="Dashboard"
      eyebrow="Internal dashboard"
      title="Daily brokerage command center"
      description="The first screen for sales and operations: follow-ups, open quotes, active load attention, AI notes, and the next work that matters."
      action={{ label: "View shipper portal", href: "/portal" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <article
            key={card.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Lead pipeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                First sales operating view
              </h2>
            </div>
            <Bot className="h-6 w-6 text-slate-400" />
          </div>
          <div className="mt-6 grid gap-3">
            {metrics.leadPipeline.map((stage) => (
              <div
                key={stage.stage}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium">{stage.stage}</p>
                <p className="text-sm text-slate-600">{stage.count} leads</p>
                <p className="text-sm font-semibold">{stage.amount}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="ai" className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            AI brief
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Today&apos;s agent notes</h2>
          <div className="mt-6 grid gap-4">
            {agentBriefs.map((brief) => (
              <div key={brief.title} className="flex gap-3">
                <brief.icon className="mt-1 h-5 w-5 flex-none text-emerald-600" />
                <div>
                  <p className="font-semibold">{brief.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {brief.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article id="loads" className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Operating checklist</h2>
          </div>
          <p className="mt-3 leading-7 text-slate-600">
            Keep each load moving through pickup, tracking, delivery, POD,
            invoice, and customer follow-up without losing context.
          </p>
          <div className="mt-6 grid gap-3">
            {["Confirm pickup", "Update shipper", "Collect POD"].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article id="carriers" className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Next build modules
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            What plugs into this shell next
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              "Lead/contact import",
              "Grok prompt templates",
              "Quote request queue",
              "DAT and Truckstop rate lookups",
              "Twilio call and SMS logging",
              "POD and invoice workflow",
            ].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </InternalShell>
  );
}
