import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
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

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-slate-400", icon: "bg-slate-100 text-slate-600" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

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

  const metrics = [
    { icon: Truck, label: "Loads", value: loadViews.length.toString() },
    { icon: FileCheck2, label: "Needs POD", value: needsPod.length.toString() },
    { icon: ReceiptText, label: "Ready to invoice", value: readyToInvoice.length.toString() },
    { icon: CheckCircle2, label: "Paid", value: paid.length.toString() },
    { icon: DollarSign, label: "Total margin", value: toCurrency(totalMargin) },
  ];

  return (
    <InternalShell
      active="Invoicing"
      eyebrow="Finance"
      title="Invoicing"
      description="POD collection, invoice readiness, open invoices, and margin visibility in one place."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item, i) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Billing queue + sidebar */}
      <section className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-700">Billing queue</p>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {billingQueue.length} loads
            </span>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
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

          <div className="grid gap-3 p-4 lg:hidden">
            {billingQueue.map((load) => (
              <BillingQueueMobileRow key={load.id} load={load} />
            ))}
          </div>

          {!billingQueue.length && (
            <div className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-400">
              No billing work is currently waiting.
            </div>
          )}
        </article>

        <aside className="grid gap-4">
          {/* Billing rules */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-slate-700">Billing rules</p>
            </div>
            <div className="grid gap-3 p-4 text-sm leading-6 text-slate-600">
              <p>Collect POD before marking delivered freight invoice-ready.</p>
              <p>Confirm carrier cost before trusting margin reporting.</p>
              <p>Keep invoice status updated so owners can see cash exposure.</p>
            </div>
          </article>

          {/* Invoice summary */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <ReceiptText className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Invoice summary</p>
            </div>
            <div className="grid gap-2 p-4">
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
    <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
