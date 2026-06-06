import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ReceiptText,
  Truck,
} from "lucide-react";

import {
  BillingQueueMobileRow,
  BillingQueueTableRow,
} from "@/components/billing-queue-row";
import { InternalShell } from "@/components/internal-shell";
import { getLoadViews } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const loadViews = await getLoadViews();
  const needsPod = loadViews.filter(
    (load) => load.billingReadiness === "Needs POD",
  );
  const readyToInvoice = loadViews.filter(
    (load) => load.billingReadiness === "Ready to invoice",
  );
  const invoiced = loadViews.filter((load) => load.invoice);
  const paid = loadViews.filter((load) => load.invoice?.paidAt);
  const totalMargin = loadViews.reduce((sum, load) => sum + load.margin, 0);
  const billingQueue = [
    ...needsPod,
    ...readyToInvoice,
    ...loadViews.filter((load) => load.invoice && !load.invoice.paidAt),
  ].filter(
    (load, index, queue) =>
      queue.findIndex((queuedLoad) => queuedLoad.id === load.id) === index,
  );

  return (
    <InternalShell
      active="Billing & Accounting"
      eyebrow="Money"
      title="Billing & Accounting"
      description="The billing workspace for POD collection, invoice readiness, open invoices, carrier cost visibility, and margin protection."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            icon: Truck,
            label: "Loads",
            value: loadViews.length.toString(),
            note: "Total managed freight",
          },
          {
            icon: FileCheck2,
            label: "Needs POD",
            value: needsPod.length.toString(),
            note: "Cannot invoice cleanly yet",
          },
          {
            icon: ReceiptText,
            label: "Ready invoice",
            value: readyToInvoice.length.toString(),
            note: "POD received or ready",
          },
          {
            icon: CheckCircle2,
            label: "Paid",
            value: paid.length.toString(),
            note: "Invoices marked paid",
          },
          {
            icon: ReceiptText,
            label: "Margin",
            value: toCurrency(totalMargin),
            note: "Current load margin",
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

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <article className="overflow-hidden rounded-lg border border-white bg-white shadow-lg shadow-slate-950/5">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Billing queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                What needs money attention
              </h2>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {billingQueue.length} loads
            </p>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <Th>Load</Th>
                  <Th>Lane</Th>
                  <Th>Status</Th>
                  <Th>Invoice</Th>
                  <Th>Margin</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingQueue.map((load) => (
                  <BillingQueueTableRow key={load.id} load={load} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            {billingQueue.map((load) => (
              <BillingQueueMobileRow key={load.id} load={load} />
            ))}
          </div>

          {!billingQueue.length ? (
            <div className="border-t border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
              No billing work is currently waiting.
            </div>
          ) : null}
        </article>

        <aside className="grid gap-4">
          <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h2 className="mt-4 text-xl font-semibold">Billing rules</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              <p>Collect POD before marking delivered freight invoice-ready.</p>
              <p>Confirm carrier cost before trusting margin reporting.</p>
              <p>Keep invoice status updated so owners can see cash exposure.</p>
            </div>
          </article>

          <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
            <ReceiptText className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-semibold">Invoice summary</h2>
            <div className="mt-4 grid gap-3">
              <BillingFact label="Created" value={invoiced.length.toString()} />
              <BillingFact
                label="Open"
                value={invoiced
                  .filter((load) => !load.invoice?.paidAt)
                  .length.toString()}
              />
              <BillingFact label="Paid" value={paid.length.toString()} />
            </div>
          </article>
        </aside>
      </section>
    </InternalShell>
  );
}

function BillingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

