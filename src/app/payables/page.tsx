import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
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
} from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-red-400", icon: "bg-red-50 text-red-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
] as const;

export default async function PayablesPage() {
  const [invoices, loadsNeedingPayable] = await Promise.all([
    getCarrierInvoiceViews(),
    getLoadsNeedingPayable(),
  ]);

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const outstanding = invoices.filter((i) => i.status !== "Paid" && i.status !== "Disputed");
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.amount, 0);
  const needsApproval = invoices.filter((i) => i.status === "Received" || i.status === "Matched").length;
  const overdue = invoices.filter((i) => i.isOverdue).length;
  const paidThisMonth = invoices.filter((i) => i.status === "Paid" && i.paidAt != null).length;

  const metrics = [
    { icon: DollarSign, label: "Outstanding", value: toCurrency(outstandingTotal) },
    { icon: Clock, label: "Needs approval", value: needsApproval.toString() },
    { icon: AlertTriangle, label: "Overdue", value: overdue.toString() },
    { icon: CheckCircle2, label: "Paid this month", value: paidThisMonth.toString() },
  ];

  return (
    <InternalShell
      active="Payables"
      eyebrow="Finance"
      title="Payables"
      description="Carrier invoices — receive, match against the rate confirmation, approve, and pay."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Loads awaiting carrier invoice */}
      {loadsNeedingPayable.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">Awaiting carrier invoice</p>
            </div>
            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
              {loadsNeedingPayable.length} load{loadsNeedingPayable.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-amber-200">
            {loadsNeedingPayable.map((load) => (
              <AwaitingPayableRow key={load.id} load={load} />
            ))}
          </div>
        </section>
      )}

      {/* Add carrier invoice form */}
      <details className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Log carrier invoice</p>
              <p className="text-xs text-slate-500">
                Record an invoice received from a carrier for a delivered load
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-open:hidden">Expand</span>
          <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">Collapse</span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <CarrierInvoiceCreateForm />
        </div>
      </details>

      {/* Payables queue table */}
      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">Payables queue</p>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Truck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No carrier invoices yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Log carrier invoices as they arrive from delivered loads.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <Th>Carrier</Th>
                    <Th>Load / Lane</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Due</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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

      {/* AP rules sidebar note */}
      <aside className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5 xl:max-w-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-slate-700">Payables rules</p>
        </div>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
          <p>Match every carrier invoice to the agreed rate on the rate confirmation before approving.</p>
          <p>Dispute any invoice that exceeds the rate con — do not pay without written approval.</p>
          <p>QuickPay requests typically carry a 2–3% fee — confirm before processing.</p>
          <p>Record payment method (ACH, check, QuickPay) when marking paid for audit trail.</p>
        </div>

        {/* Batch pay action (Phase 4.2) */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <form action="/api/carrier-invoices/batch-pay" method="POST">
            <button
              type="submit"
              className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Create Payment Batch
            </button>
            <p className="mt-1 text-[10px] text-slate-500">
              Assigns a batch reference to unbatched APPROVED invoices for payment review.
            </p>
          </form>
        </div>
      </aside>
    </InternalShell>
  );
}

function AwaitingPayableRow({ load }: { load: { id: string; loadNumber: string; carrierName: string; lane: string; delivery: string; agreedRate: number; status: string } }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 sm:grid-cols-[auto_1fr_auto_auto_auto]">
      <p className="text-xs font-bold text-amber-700">{load.loadNumber}</p>
      <div>
        <p className="text-sm font-semibold text-slate-900">{load.carrierName}</p>
        <p className="text-xs text-slate-600">{load.lane}</p>
      </div>
      <p className="hidden text-xs text-slate-500 sm:block">Del {load.delivery}</p>
      <p className="hidden font-bold text-slate-900 sm:block">{toCurrency(load.agreedRate)}</p>
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        {load.status}
      </span>
    </div>
  );
}

function CarrierInvoiceCreateForm() {
  return (
    <form action="/api/carrier-invoices" method="POST" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Load ID</label>
        <input
          name="loadId"
          placeholder="Load database ID"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Carrier ID</label>
        <input
          name="carrierId"
          placeholder="Carrier database ID"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Carrier invoice #</label>
        <input
          name="invoiceNumber"
          placeholder="e.g. INV-2024-001"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Invoice amount ($)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="1800.00"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Agreed rate (rate con $)</label>
        <input
          name="agreedRate"
          type="number"
          step="0.01"
          placeholder="1750.00"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Due date</label>
        <input
          name="dueDate"
          type="date"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-slate-700">Approval owner</label>
        <input
          name="approvalOwner"
          placeholder="Who approved"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-1 sm:col-span-2 lg:col-span-3">
        <label className="text-xs font-semibold text-slate-700">Notes / Remittance / QuickPay details</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Accessorial charges, dispute details, QuickPay request, remittance info, etc."
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
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
