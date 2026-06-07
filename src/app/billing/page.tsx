import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  DollarSign,
  FileCheck2,
  ReceiptText,
} from "lucide-react";

import {
  BillingQueueMobileRow,
  BillingQueueTableRow,
} from "@/components/billing-queue-row";
import { InternalShell } from "@/components/internal-shell";
import { getLoadViews, type LoadView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
  { border: "border-l-[3px] border-l-slate-400", icon: "bg-slate-100 text-slate-600" },
] as const;

function getInvoiceBalance(load: LoadView) {
  if (!load.invoice) return 0;
  return load.invoice.balance ?? load.invoice.amount;
}

function getBillingCommand({
  needsPod,
  readyToInvoice,
  openInvoices,
}: {
  needsPod: LoadView[];
  readyToInvoice: LoadView[];
  openInvoices: LoadView[];
}) {
  if (needsPod.length) {
    return {
      label: "Collect PODs before billing",
      detail: `${needsPod.length} delivered load${needsPod.length === 1 ? "" : "s"} cannot cleanly move to invoice until proof of delivery is uploaded and reviewed.`,
      icon: AlertTriangle,
      className: "border-amber-100 bg-amber-50 text-amber-900",
    };
  }

  if (readyToInvoice.length) {
    return {
      label: "Create customer invoices",
      detail: `${readyToInvoice.length} load${readyToInvoice.length === 1 ? " is" : "s are"} ready for customer billing now.`,
      icon: ReceiptText,
      className: "border-emerald-100 bg-emerald-50 text-emerald-900",
    };
  }

  if (openInvoices.length) {
    return {
      label: "Work open AR",
      detail: `${openInvoices.length} invoice${openInvoices.length === 1 ? "" : "s"} are created but not marked paid.`,
      icon: Clock,
      className: "border-sky-100 bg-sky-50 text-sky-900",
    };
  }

  return {
    label: "Billing queue is clear",
    detail: "No POD, invoice creation, or payment update work is waiting right now.",
    icon: CheckCircle2,
    className: "border-emerald-100 bg-emerald-50 text-emerald-900",
  };
}

export default async function BillingPage() {
  const loadViews = await getLoadViews();
  const needsPod = loadViews.filter(
    (load) => load.billingReadiness === "Needs POD",
  );
  const readyToInvoice = loadViews.filter(
    (load) => load.billingReadiness === "Ready to invoice",
  );
  const invoiced = loadViews.filter((load) => load.invoice);
  const openInvoices = invoiced.filter((load) => !load.invoice?.paidAt);
  const paid = loadViews.filter((load) => load.invoice?.paidAt);
  const openBalance = openInvoices.reduce((sum, load) => sum + getInvoiceBalance(load), 0);
  const paidAmount = paid.reduce((sum, load) => sum + (load.invoice?.amount ?? 0), 0);
  const totalMargin = loadViews.reduce((sum, load) => sum + load.margin, 0);
  const billingQueue = [
    ...needsPod,
    ...readyToInvoice,
    ...openInvoices,
  ].filter(
    (load, index, queue) =>
      queue.findIndex((queuedLoad) => queuedLoad.id === load.id) === index,
  );
  const billingCommand = getBillingCommand({ needsPod, readyToInvoice, openInvoices });
  const CommandIcon = billingCommand.icon;

  const metrics = [
    { icon: ReceiptText, label: "Ready to invoice", value: readyToInvoice.length.toString(), helper: "Clean loads ready for AR" },
    { icon: FileCheck2, label: "Needs POD", value: needsPod.length.toString(), helper: "Blocks customer invoice" },
    { icon: CircleDollarSign, label: "Open AR", value: toCurrency(openBalance), helper: `${openInvoices.length} unpaid invoice${openInvoices.length === 1 ? "" : "s"}` },
    { icon: CheckCircle2, label: "Paid", value: toCurrency(paidAmount), helper: `${paid.length} paid invoice${paid.length === 1 ? "" : "s"}` },
    { icon: DollarSign, label: "Visible margin", value: toCurrency(totalMargin), helper: "Across visible loads" },
  ];

  return (
    <InternalShell
      active="Invoicing"
      eyebrow="Finance"
      title="Invoicing"
      description="Customer billing command center for POD readiness, invoice creation, open AR, payment status, and margin visibility."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item, index) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[index].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[index].icon}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className={`rounded-lg border p-5 shadow-sm ${billingCommand.className}`}>
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <CommandIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Billing priority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{billingCommand.label}</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                {billingCommand.detail}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Cash snapshot
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <BillingFact label="Created" value={invoiced.length.toString()} />
            <BillingFact label="Open AR" value={toCurrency(openBalance)} />
            <BillingFact label="Collected" value={toCurrency(paidAmount)} />
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">Billing queue</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Work in order: POD exceptions, invoice-ready loads, then unpaid invoices.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            {billingQueue.length} {billingQueue.length === 1 ? "load" : "loads"}
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <Th>Load</Th>
                <Th>Lane</Th>
                <Th>Billing gate</Th>
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

        {!billingQueue.length ? (
          <div className="border-t border-slate-100 px-5 py-10 text-center">
            <ReceiptText className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              No billing work is currently waiting
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Delivered loads will appear here when POD, invoice, or payment attention is needed.
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-black text-slate-800">Billing guardrails</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Collect and review POD before invoicing, confirm carrier cost before trusting margin, and keep invoice status current so owners can see cash exposure.
            </p>
          </div>
        </div>
      </section>
    </InternalShell>
  );
}

function BillingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
