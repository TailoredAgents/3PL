import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  ReceiptText,
  Truck,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import {
  PayablesMobileRow,
  PayablesTableRow,
} from "@/components/payables-queue-row";
import {
  getCarrierInvoiceViews,
  getLoadsNeedingPayable,
  type CarrierInvoiceView,
  type LoadNeedingPayableView,
} from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  {
    border: "border-l-[3px] border-l-amber-400",
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  },
  {
    border: "border-l-[3px] border-l-sky-400",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  {
    border: "border-l-[3px] border-l-red-400",
    icon: "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200",
  },
  {
    border: "border-l-[3px] border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
] as const;

const panelClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25";
const panelHeaderClass =
  "border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40";
const inputClass =
  "rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-100 dark:placeholder:text-slate-500";

function getPaymentCommand({
  awaitingInvoices,
  needsApproval,
  overdue,
  approvedUnbatched,
}: {
  awaitingInvoices: LoadNeedingPayableView[];
  needsApproval: CarrierInvoiceView[];
  overdue: CarrierInvoiceView[];
  approvedUnbatched: CarrierInvoiceView[];
}) {
  if (overdue.length) {
    return {
      label: "Resolve overdue carrier invoices",
      detail: `${overdue.length} carrier invoice${overdue.length === 1 ? "" : "s"} are past due. Review disputes, approvals, and payment status first.`,
      icon: AlertTriangle,
      className:
        "border-red-100 bg-red-50 text-red-900 dark:border-red-500/45 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  if (needsApproval.length) {
    return {
      label: "Approve matched invoices",
      detail: `${needsApproval.length} invoice${needsApproval.length === 1 ? "" : "s"} need approval before payment can be released.`,
      icon: Clock,
      className:
        "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (approvedUnbatched.length) {
    return {
      label: "Create payment batch",
      detail: `${approvedUnbatched.length} approved invoice${approvedUnbatched.length === 1 ? "" : "s"} are ready to stage for payment review.`,
      icon: DollarSign,
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
    };
  }

  if (awaitingInvoices.length) {
    return {
      label: "Collect missing carrier invoices",
      detail: `${awaitingInvoices.length} delivered load${awaitingInvoices.length === 1 ? "" : "s"} have carrier cost history but no carrier invoice logged yet.`,
      icon: ReceiptText,
      className:
        "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-500/45 dark:bg-sky-950/30 dark:text-sky-100",
    };
  }

  return {
    label: "Payables queue is clear",
    detail: "No carrier invoices currently need collection, approval, batching, or payment.",
    icon: CheckCircle2,
    className:
      "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default async function PayablesPage() {
  const [invoices, loadsNeedingPayable] = await Promise.all([
    getCarrierInvoiceViews(),
    getLoadsNeedingPayable(),
  ]);

  const outstanding = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.status !== "Disputed");
  const outstandingTotal = outstanding.reduce((sum, invoice) => sum + invoice.amount, 0);
  const approvalQueue = invoices.filter((invoice) => invoice.status === "Received" || invoice.status === "Matched");
  const overdueInvoices = invoices.filter((invoice) => invoice.isOverdue);
  const approvedUnbatched = invoices.filter((invoice) => invoice.status === "Approved" && !invoice.paymentBatch);
  const paidThisMonth = invoices.filter((invoice) => invoice.status === "Paid" && invoice.paidAt != null);
  const paymentCommand = getPaymentCommand({
    awaitingInvoices: loadsNeedingPayable,
    needsApproval: approvalQueue,
    overdue: overdueInvoices,
    approvedUnbatched,
  });
  const CommandIcon = paymentCommand.icon;

  const metrics = [
    { icon: DollarSign, label: "Outstanding", value: toCurrency(outstandingTotal), helper: `${outstanding.length} open invoice${outstanding.length === 1 ? "" : "s"}` },
    { icon: Clock, label: "Needs approval", value: approvalQueue.length.toString(), helper: "Received or matched" },
    { icon: AlertTriangle, label: "Overdue", value: overdueInvoices.length.toString(), helper: "Past due unpaid" },
    { icon: CheckCircle2, label: "Paid this month", value: paidThisMonth.length.toString(), helper: "Marked paid" },
  ];

  return (
    <InternalShell
      active="Payables"
      eyebrow="Finance"
      title="Payables"
      description="Carrier AP command center for invoice receipt, rate-con matching, approval, batching, and payment."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => (
          <article
            key={item.label}
            className={`${panelClass} ${CARD_ACCENTS[index].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[index].icon}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                {item.value}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className={`rounded-lg border p-5 shadow-sm ${paymentCommand.className}`}>
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
              <CommandIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Payment priority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{paymentCommand.label}</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                {paymentCommand.detail}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Payment batch
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Stage approved, unbatched invoices for payment review after rate-con matching is complete.
          </p>
          <form action="/api/carrier-invoices/batch-pay" method="POST" className="mt-4">
            <button
              type="submit"
              className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800"
            >
              Create payment batch
            </button>
          </form>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {approvedUnbatched.length} approved invoice{approvedUnbatched.length === 1 ? "" : "s"} currently eligible.
          </p>
        </article>
      </section>

      {loadsNeedingPayable.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-500/45 dark:bg-amber-950/30">
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100/60 px-5 py-3 dark:border-amber-500/30 dark:bg-amber-950/35">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-black text-amber-900 dark:text-amber-100">Awaiting carrier invoice</p>
            </div>
            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
              {loadsNeedingPayable.length} load{loadsNeedingPayable.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-500/30">
            {loadsNeedingPayable.map((load) => (
              <AwaitingPayableRow key={load.id} load={load} />
            ))}
          </div>
        </section>
      ) : null}

      <details className={`group ${panelClass}`}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-950/45">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
              <Plus className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Log carrier invoice</p>
              <p className="text-xs text-slate-500">
                Record an invoice received from a carrier for a delivered load.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-open:hidden">Expand</span>
          <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">Collapse</span>
        </summary>
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <CarrierInvoiceCreateForm />
        </div>
      </details>

      <section className={panelClass}>
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${panelHeaderClass}`}>
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Payables queue</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Match to rate confirmation, approve clean invoices, dispute variances, then mark paid.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Truck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">No carrier invoices yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Carrier invoices will appear here after delivered loads are logged into AP.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-400">
                  <tr>
                    <Th>Carrier</Th>
                    <Th>Load / Lane</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Due</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((invoice) => (
                    <PayablesTableRow key={invoice.id} invoice={invoice} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {invoices.map((invoice) => (
                <PayablesMobileRow key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Payables guardrails</p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Match every carrier invoice to the agreed rate before approving, dispute variances unless an owner accepts them, and record approver, payer, batch, method, and QuickPay details for audit.
            </p>
          </div>
        </div>
      </section>
    </InternalShell>
  );
}

function AwaitingPayableRow({ load }: { load: LoadNeedingPayableView }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 sm:grid-cols-[auto_1fr_auto_auto_auto]">
      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{load.loadNumber}</p>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{load.carrierName}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">{load.lane}</p>
      </div>
      <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Del {load.delivery}</p>
      <p className="hidden font-bold text-slate-900 dark:text-slate-50 sm:block">{toCurrency(load.agreedRate)}</p>
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
        {load.status}
      </span>
    </div>
  );
}

function CarrierInvoiceCreateForm() {
  return (
    <form action="/api/carrier-invoices" method="POST" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Load ID</label>
        <input
          name="loadId"
          placeholder="Load database ID"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Carrier ID</label>
        <input
          name="carrierId"
          placeholder="Carrier database ID"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Carrier invoice #</label>
        <input
          name="invoiceNumber"
          placeholder="e.g. INV-2024-001"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice amount ($)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="1800.00"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agreed rate (rate con $)</label>
        <input
          name="agreedRate"
          type="number"
          step="0.01"
          placeholder="1750.00"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due date</label>
        <input
          name="dueDate"
          type="date"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approval owner</label>
        <input
          name="approvalOwner"
          placeholder="Who approved"
          className={inputClass}
        />
      </div>
      <div className="grid gap-1 sm:col-span-2 lg:col-span-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Remittance / QuickPay details</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Accessorial charges, dispute details, QuickPay request, remittance info, etc."
          className={inputClass}
        />
      </div>
      <div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-950 dark:ring-1 dark:ring-slate-700 dark:hover:bg-slate-900"
        >
          Log invoice
        </button>
      </div>
    </form>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
