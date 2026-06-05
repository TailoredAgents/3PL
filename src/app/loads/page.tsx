import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  FileCheck2,
  MapPinned,
  ReceiptText,
  Truck,
} from "lucide-react";

import { LoadCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getLoadViews } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LoadsPage() {
  const loadViews = await getLoadViews();
  const totalMargin = loadViews.reduce((total, load) => total + load.margin, 0);
  const needsPod = loadViews.filter((load) =>
    load.billingReadiness === "Needs POD",
  ).length;
  const readyToInvoice = loadViews.filter(
    (load) => load.billingReadiness === "Ready to invoice",
  ).length;
  const needsCustomerUpdate = loadViews.filter(
    (load) => load.customerUpdateStatus === "Needed",
  ).length;
  const needsRateConfirmation = loadViews.filter(
    (load) => load.rateConfirmationStatus !== "Signed",
  ).length;

  return (
    <InternalShell
      active="Loads"
      eyebrow="TMS"
      title="Load operations"
      description="Manage booked freight from tender to delivery, tracking, POD, invoice readiness, and margin visibility."
      action={{ label: "Carrier desk", href: "/carriers" }}
    >
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Loads", value: loadViews.length.toString() },
          { label: "Projected margin", value: toCurrency(totalMargin) },
          { label: "Needs POD", value: needsPod.toString() },
          {
            label: "Needs customer update",
            value: needsCustomerUpdate.toString(),
          },
          {
            label: "Needs rate conf",
            value: needsRateConfirmation.toString(),
          },
          {
            label: "Ready to invoice",
            value: readyToInvoice.toString(),
          },
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

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Create load</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Create a load once freight is ready to execute. Assign a carrier now
          or leave it tendered while coverage is being worked.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <LoadCreateForm />
        </div>
      </section>

      <section className="grid gap-6">
        {loadViews.map((load) => (
          <article
            key={load.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{load.shipper}</h2>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    {load.status}
                  </span>
                </div>
                <p className="mt-2 text-lg font-medium text-slate-700">
                  {load.lane}
                </p>
              </div>
              <Link
                href={`/loads/${load.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open load
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-4">
                <Truck className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Carrier
                </p>
                <p className="mt-1 font-medium">{load.carrier}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <MapPinned className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Pickup / Delivery
                </p>
                <p className="mt-1 font-medium">
                  {load.pickup} to {load.delivery}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Margin
                </p>
                <p className="mt-1 font-medium">
                  {toCurrency(load.margin)} ({load.marginPercent}%)
                </p>
              </div>
              <div className="rounded-md bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="mt-3 text-sm font-semibold text-amber-900">
                  Risk note
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  {load.risk}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  POD
                </p>
                <p className="mt-1 font-medium">
                  {load.hasPod ? "Received" : "Needed"}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <ReceiptText className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Billing
                </p>
                <p className="mt-1 font-medium">{load.billingReadiness}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Rate confirmation
                </p>
                <p className="mt-1 font-medium">
                  {load.rateConfirmationStatus ?? "Not started"}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <MapPinned className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Customer update
                </p>
                <p className="mt-1 font-medium">
                  {load.customerUpdateStatus ?? "Not needed"}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Invoice
                </p>
                <p className="mt-1 font-medium">
                  {load.invoice
                    ? `${toCurrency(load.invoice.amount)} ${load.invoice.status}`
                    : "Not created"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </InternalShell>
  );
}
