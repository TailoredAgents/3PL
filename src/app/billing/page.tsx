import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  DollarSign,
  FileCheck2,
  Gauge,
  ReceiptText,
  TrendingUp,
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
  {
    border: "border-l-[3px] border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
  {
    border: "border-l-[3px] border-l-amber-400",
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  },
  {
    border: "border-l-[3px] border-l-sky-400",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  {
    border: "border-l-[3px] border-l-violet-400",
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  },
] as const;

const panelClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25";
const panelHeaderClass =
  "border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40";

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
      className:
        "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (readyToInvoice.length) {
    return {
      label: "Create customer invoices",
      detail: `${readyToInvoice.length} load${readyToInvoice.length === 1 ? " is" : "s are"} ready for customer billing now.`,
      icon: ReceiptText,
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
    };
  }

  if (openInvoices.length) {
    return {
      label: "Work open AR",
      detail: `${openInvoices.length} invoice${openInvoices.length === 1 ? "" : "s"} are created but not marked paid.`,
      icon: Clock,
      className:
        "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-500/45 dark:bg-sky-950/30 dark:text-sky-100",
    };
  }

  return {
    label: "Billing queue is clear",
    detail: "No POD, invoice creation, or payment update work is waiting right now.",
    icon: CheckCircle2,
    className:
      "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
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
  const createdAmount = invoiced.reduce((sum, load) => sum + (load.invoice?.amount ?? 0), 0);
  const billingExposure = readyToInvoice.reduce((sum, load) => sum + load.customerRate, 0);
  const unpaidMargin = openInvoices.reduce((sum, load) => sum + load.margin, 0);
  const collectionRate = createdAmount > 0 ? (paidAmount / createdAmount) * 100 : 0;
  const overdueInvoices = openInvoices.filter((load) =>
    isPastDue(load.invoice?.dueDate),
  );
  const dueSoonInvoices = openInvoices.filter((load) =>
    isDueSoon(load.invoice?.dueDate),
  );
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
    { icon: ReceiptText, label: "Ready revenue", value: toCurrency(billingExposure), helper: `${readyToInvoice.length} ready load${readyToInvoice.length === 1 ? "" : "s"}` },
    { icon: FileCheck2, label: "POD blockers", value: needsPod.length.toString(), helper: "Stops customer billing" },
    { icon: CircleDollarSign, label: "Open AR", value: toCurrency(openBalance), helper: `${openInvoices.length} unpaid invoice${openInvoices.length === 1 ? "" : "s"}` },
    { icon: TrendingUp, label: "Visible margin", value: toCurrency(totalMargin), helper: "Across active records" },
  ];

  return (
    <InternalShell
      active="Invoicing"
      eyebrow="Finance"
      title="Invoicing"
      description="Customer billing command center for POD readiness, invoice creation, open AR, payment status, and margin visibility."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => (
          <MetricCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            helper={item.helper}
            accent={CARD_ACCENTS[index]}
          />
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <article className={`rounded-lg border p-5 shadow-sm ${billingCommand.className}`}>
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
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
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <BillingStep
                  label="1. POD review"
                  value={`${needsPod.length} blocker${needsPod.length === 1 ? "" : "s"}`}
                />
                <BillingStep
                  label="2. Invoice creation"
                  value={`${readyToInvoice.length} ready`}
                />
                <BillingStep
                  label="3. Collections"
                  value={`${openInvoices.length} open`}
                />
              </div>
            </div>
          </div>
        </article>

        <article className={panelClass}>
          <div className={`flex items-center justify-between gap-3 ${panelHeaderClass}`}>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">Cash control</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {collectionRate.toFixed(0)}% collected
            </span>
          </div>
          <div className="grid gap-3 p-5">
            <BillingFact label="Invoices created" value={invoiced.length.toString()} />
            <BillingFact label="Collected" value={toCurrency(paidAmount)} />
            <BillingFact label="Unpaid margin" value={toCurrency(unpaidMargin)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <BillingRisk
                label="Overdue"
                value={overdueInvoices.length.toString()}
                tone={overdueInvoices.length ? "red" : "slate"}
              />
              <BillingRisk
                label="Due soon"
                value={dueSoonInvoices.length.toString()}
                tone={dueSoonInvoices.length ? "amber" : "slate"}
              />
            </div>
          </div>
        </article>
      </section>

      <section className={panelClass}>
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${panelHeaderClass}`}>
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Billing queue</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Work in order: POD exceptions, invoice-ready loads, then unpaid invoices.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {billingQueue.length} {billingQueue.length === 1 ? "load" : "loads"}
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-400">
              <tr>
                <Th>Load</Th>
                <Th>Lane</Th>
                <Th>Billing gate</Th>
                <Th>Invoice</Th>
                <Th>Margin</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
          <div className="border-t border-slate-100 px-5 py-8 text-center dark:border-slate-800">
            <ReceiptText className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
              No billing work is currently waiting
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Delivered loads will appear here when POD, invoice, or payment attention is needed.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Guardrail
          icon={FileCheck2}
          title="POD before AR"
          text="Collect and review proof of delivery before sending a customer invoice."
        />
        <Guardrail
          icon={DollarSign}
          title="Confirm margin"
          text="Verify carrier cost before trusting the visible margin on billing records."
        />
        <Guardrail
          icon={Clock}
          title="Keep status fresh"
          text="Update invoice status quickly so ownership can see cash exposure."
        />
      </section>
    </InternalShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  accent: (typeof CARD_ACCENTS)[number];
}) {
  return (
    <article className={`${panelClass} ${accent.border}`}>
      <div className="p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {value}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function BillingStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/65 px-3 py-2 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function BillingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/45">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function BillingRisk({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "red" | "slate";
}) {
  const className =
    tone === "red"
      ? "border-red-100 bg-red-50 text-red-800 dark:border-red-500/45 dark:bg-red-950/30 dark:text-red-100"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-300";

  return (
    <div className={`rounded-md border px-4 py-3 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.12em] opacity-75">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Guardrail({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-200">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
        </div>
      </div>
    </article>
  );
}

function isPastDue(dueDate?: string | null) {
  if (!dueDate) return false;
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

function isDueSoon(dueDate?: string | null) {
  if (!dueDate || isPastDue(dueDate)) return false;
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  const diffDays = (parsed.getTime() - today.getTime()) / 86_400_000;
  return diffDays <= 7;
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
