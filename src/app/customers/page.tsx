import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileText,
  MapPinned,
  Target,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getLeadViews, getShipperViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [leadViews, shipperViews] = await Promise.all([
    getLeadViews(),
    getShipperViews(),
  ]);
  const followUpLeads = leadViews.slice(0, 5);
  const quoteReadyLeads = leadViews.filter((lead) =>
    ["Qualified", "Quoted"].includes(lead.stage),
  );
  const knownLaneCount = shipperViews.reduce(
    (total, shipper) => total + shipper.lanes.length,
    0,
  );

  return (
    <InternalShell
      active="Customers"
      eyebrow="Relationships"
      title="Customers"
      description="The relationship workspace for prospects, active shippers, contacts, lanes, follow-ups, and customer history."
      action={{ label: "Create customer", href: "/shippers" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Building2,
            label: "Companies",
            value: shipperViews.length.toString(),
            note: "Customer and prospect files",
          },
          {
            icon: Users,
            label: "Working leads",
            value: leadViews.length.toString(),
            note: "Open sales opportunities",
          },
          {
            icon: CalendarClock,
            label: "Follow-ups",
            value: followUpLeads.length.toString(),
            note: "Start here before new outreach",
          },
          {
            icon: MapPinned,
            label: "Known lanes",
            value: knownLaneCount.toString(),
            note: "Lane memory for repeat freight",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_0.85fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Relationship queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Customers needing attention
              </h2>
            </div>
            <Link
              href="/leads"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {followUpLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {lead.company}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {lead.contact} | {lead.stage}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                    {lead.nextFollowUp}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                  {lead.aiNextAction}
                </p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-semibold">Quote-ready customers</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Qualified or quoted leads that should move into Quotes & Pricing.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {quoteReadyLeads.length ? (
              quoteReadyLeads.slice(0, 6).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{lead.company}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {lead.lanes}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      {lead.stage}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No quote-ready customers are currently waiting.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Company files
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Shippers and lanes
            </h2>
          </div>
          <Link
            href="/shippers"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-emerald-200 hover:text-emerald-700"
          >
            Manage company files
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {shipperViews.slice(0, 6).map((shipper) => (
            <Link
              key={shipper.id}
              href={`/shippers/${shipper.id}`}
              className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {shipper.company}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {shipper.primaryContact} | {shipper.industry}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                  {shipper.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {shipper.lanes.slice(0, 3).map((lane) => (
                  <span
                    key={lane}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    {lane}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Users,
            title: "Sales pipeline",
            body: "Work stages, calls, follow-ups, AI next actions, and contact import.",
            href: "/leads",
            action: "Open leads",
          },
          {
            icon: Building2,
            title: "Company records",
            body: "Manage shipper profiles, contacts, lanes, and account notes.",
            href: "/shippers",
            action: "Open shippers",
          },
          {
            icon: FileText,
            title: "Quotes & Pricing",
            body: "Price qualified customer demand and send customer quotes.",
            href: "/quote-requests",
            action: "Open quotes",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <item.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
              {item.action}
              <ArrowRight className="h-4 w-4" />
            </p>
          </Link>
        ))}
      </section>
    </InternalShell>
  );
}
