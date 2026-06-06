import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Gauge,
  Mail,
  PhoneCall,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getIntakeViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const intakeItems = await getIntakeViews();
  const auditCount = intakeItems.filter((item) =>
    item.type.toLowerCase().includes("audit"),
  ).length;
  const quoteCount = intakeItems.length - auditCount;

  return (
    <InternalShell
      active="Intake"
      eyebrow="Operator queue"
      title="Audit and quote intake"
      description="Review every public savings audit and quote request from one queue before it becomes follow-up, pricing work, or a booked opportunity."
      action={{ label: "Public forms", href: "/#audit" }}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total intake", value: intakeItems.length.toString() },
          { label: "Savings audits", value: auditCount.toString() },
          { label: "Quote requests", value: quoteCount.toString() },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: PhoneCall,
            title: "Calls",
            body: "Review call recordings, transcripts, extraction status, and quote request conversion.",
            href: "/calls",
            action: "Open calls",
          },
          {
            icon: Mail,
            title: "Email events",
            body: "Track quote email delivery, bounces, complaints, and suppressed recipients.",
            href: "/email",
            action: "Open email events",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <item.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.body}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
              {item.action}
              <ArrowRight className="h-4 w-4" />
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Review queue</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {intakeItems.length ? (
              intakeItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold">{item.company}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                          {item.type}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.created}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                No intake records yet.
              </p>
            )}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Gauge className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Review rules</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
              <p>1. Audit submissions should become a call within one business hour.</p>
              <p>2. Quote requests need service details before rate work starts.</p>
              <p>3. Anything urgent should become a lead activity and follow-up.</p>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Next workflow</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              The next build pass should add detail review screens for each audit
              and quote request, then allow conversion into follow-up tasks,
              customer quotes, and loads.
            </p>
            <Link
              href="/quote-requests"
              className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Quotes & Pricing
            </Link>
          </article>
        </div>
      </section>
    </InternalShell>
  );
}
