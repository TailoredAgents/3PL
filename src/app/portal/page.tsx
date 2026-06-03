import Link from "next/link";
import { ArrowLeft, Lightbulb, Plus, ReceiptText, Truck } from "lucide-react";

import { platformName, portalLoads } from "@/lib/data";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Public site
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Shipper portal
            </h1>
            <p className="mt-2 text-slate-600">
              Customer-facing load posting, tracking, history, reports, and AI
              lane suggestions.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Internal dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {platformName}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Your freight desk in one clean portal.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                The first version is a product shell. Authentication, shipper
                scoping, documents, invoices, and live tracking will attach to
                the database records created in milestone one.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Plus, label: "Post new load", value: "Fast intake" },
                { icon: Truck, label: "Active shipments", value: "Live view" },
                { icon: ReceiptText, label: "Invoices", value: "Payment status" },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <item.icon className="h-6 w-6 text-emerald-600" />
                  <p className="mt-5 font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Shipment activity</h2>
            <div className="mt-6 grid gap-3">
              {portalLoads.map((load) => (
                <div
                  key={load.lane}
                  className="grid gap-2 rounded-md bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-semibold">{load.lane}</p>
                    <p className="mt-1 text-sm text-slate-600">{load.status}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{load.eta}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-3">
              <Lightbulb className="mt-1 h-6 w-6 flex-none text-emerald-600" />
              <div>
                <h2 className="text-2xl font-semibold">AI lane suggestion</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Your Atlanta to Dallas dry van lane is running hot. Once rate
                  integrations are live, the portal can suggest whether to lock
                  in pricing, quote spot, or shift pickup windows.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
