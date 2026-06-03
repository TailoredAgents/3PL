import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { QuoteForm, SavingsAuditForm } from "@/components/forms";
import {
  navItems,
  operationsModules,
  platformName,
  stats,
  valueProps,
  workflow,
} from "@/lib/data";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/20 bg-slate-950/90 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {platformName}
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-200 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="#quote"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Get quote
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/freight-hero.png"
          alt="Modern freight brokerage logistics scene at a distribution center"
          fill
          priority
          className="object-cover opacity-55"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl content-center px-5 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-200">
              Non-asset freight brokerage built from Atlanta
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              AI-native freight brokerage without the bloat.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              A custom CRM and TMS operating system for quote intake, AI savings
              audits, carrier matching, shipment tracking, billing, and repeat
              shipper growth.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#audit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                Get free AI savings audit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                View internal dashboard
              </Link>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-20 md:grid-cols-3">
        {valueProps.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <item.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </section>

      <section id="audit" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Public funnel
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Free AI Freight Savings Audit
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Shippers upload old invoices or rate confirmations. Grok extracts
              lane data, flags likely savings, and creates a CRM lead with a
              call script and follow-up path.
            </p>
            <ul className="mt-8 grid gap-3 text-sm font-medium text-slate-700">
              {[
                "Extract lane, equipment, total charge, accessorials, and rate-per-mile.",
                "Generate a one-page shipper-facing savings report.",
                "Create internal lead, contact, audit, and AI agent log records.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-8">
            <SavingsAuditForm />
          </div>
        </div>
      </section>

      <section id="quote" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <QuoteForm />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Instant intake
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Turn every quote request into structured brokerage work.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              The quote intake form is intentionally simple for shippers, but it
              feeds a structured internal workflow: pricing, carrier matching,
              follow-up, booking, tracking, billing, and margin reporting.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Operating model
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              One workflow from lead capture to paid load.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {workflow.map((step, index) => (
              <article
                key={step}
                className="rounded-lg border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm font-semibold text-emerald-300">
                  Step {index + 1}
                </p>
                <p className="mt-4 leading-7 text-slate-200">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Internal system
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              CRM, TMS, and AI command center in one platform.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              The first milestone creates the operating spine. DAT, Truckstop,
              Twilio, Clerk, payments, and portal depth can plug into the same
              records as the business matures.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {operationsModules.map((module) => (
              <article
                key={module.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <module.icon className="h-6 w-6 text-emerald-600" />
                <h3 className="mt-4 text-lg font-semibold">{module.title}</h3>
                <ul className="mt-4 grid gap-2 text-sm text-slate-600">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{platformName} is a working placeholder until branding is final.</p>
          <p>Built for a pure non-asset freight brokerage.</p>
        </div>
      </footer>
    </main>
  );
}
