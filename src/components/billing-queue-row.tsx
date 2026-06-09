"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCheck,
  FileCheck2,
  Loader2,
  ReceiptText,
} from "lucide-react";

import { cn, toCurrency } from "@/lib/utils";

type BillingLoad = {
  id: string;
  loadNumber: string;
  shipper: string;
  lane: string;
  delivery: string;
  billingReadiness: string;
  customerRate: number;
  margin: number;
  marginPercent: number;
  customerReference?: string;
  hasPod: boolean;
  invoice: {
    invoiceNumber?: string | null;
    amount: number;
    balance?: number | null;
    status: string;
    terms?: string | null;
    sentAt?: string | null;
    dueDate?: string | null;
    paidAt?: string | null;
  } | null;
  documents: Array<{
    type: string;
    fileName: string;
    downloadHref: string | null;
  }>;
};

export function BillingQueueTableRow({ load }: { load: BillingLoad }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canCreateInvoice =
    load.billingReadiness === "Ready to invoice" && !load.invoice;
  const canMarkPaid =
    load.invoice && load.invoice.status !== "Paid" && !load.invoice.paidAt;
  const needsPod = load.billingReadiness === "Needs POD";
  const podDocument = load.documents.find((document) => document.type === "Pod");

  async function createInvoice() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const fd = new FormData();
      fd.append("amount", String(load.customerRate));
      fd.append("status", "SENT");
      fd.append("dueDate", dueDate.toISOString().slice(0, 10));
      await fetch(`/api/loads/${load.id}/invoice`, {
        method: "POST",
        body: fd,
      });
      setDone(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function markPaid() {
    if (submitting || !load.invoice) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", String(load.invoice.amount));
      fd.append("status", "PAID");
      await fetch(`/api/loads/${load.id}/invoice`, {
        method: "POST",
        body: fd,
      });
      setDone(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <tr className="align-top hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
      <Td>
        <Link
          href={`/loads/${load.id}?tab=billing`}
          className="font-semibold text-slate-950 hover:text-emerald-700 dark:text-slate-50 dark:hover:text-emerald-300"
        >
          {load.shipper}
        </Link>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {load.loadNumber}
        </p>
        {load.customerReference ? (
          <p className="mt-0.5 text-xs text-slate-400">
            Ref {load.customerReference}
          </p>
        ) : null}
      </Td>
      <Td>
        <p className="font-semibold text-slate-900 dark:text-slate-50">{load.lane}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Del {load.delivery}
        </p>
      </Td>
      <Td>
        <BillingStatusPill label={load.billingReadiness} />
        <p className="mt-1.5 text-xs text-slate-500">
          POD {load.hasPod ? "✓" : "needed"}
        </p>
        {podDocument?.downloadHref ? (
          <Link
            href={podDocument.downloadHref}
            target="_blank"
            className="mt-1 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            Download POD
          </Link>
        ) : null}
      </Td>
      <Td>
        <p className="font-semibold text-slate-900 dark:text-slate-50">
          {load.invoice?.invoiceNumber ? `${load.invoice.invoiceNumber} · ` : ""}{load.invoice?.status ?? "Not created"}
        </p>
        {load.invoice?.terms ? (
          <p className="mt-0.5 text-xs text-slate-500">{load.invoice.terms}</p>
        ) : null}
        {load.invoice?.dueDate ? (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Due {load.invoice.dueDate}
          </p>
        ) : null}
        {load.invoice?.paidAt ? (
          <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Paid {load.invoice.paidAt}
          </p>
        ) : null}
      </Td>
      <Td>
        <p
          className={cn(
            "font-bold",
            load.marginPercent < 12
              ? "text-red-700 dark:text-red-300"
              : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {toCurrency(load.margin)}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {load.marginPercent}%
        </p>
      </Td>
      <Td>
        <div className="flex flex-col gap-2">
          {done ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
              <CheckCheck className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : canCreateInvoice ? (
            <button
              onClick={createInvoice}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ReceiptText className="h-3.5 w-3.5" />
              )}
              Create invoice
            </button>
          ) : needsPod ? (
            <Link
              href={`/loads/${load.id}?tab=documents`}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              Upload POD
            </Link>
          ) : canMarkPaid ? (
            <button
              onClick={markPaid}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark paid
            </button>
          ) : null}
          <Link
            href={`/loads/${load.id}?tab=billing`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
          >
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Td>
    </tr>
  );
}

export function BillingQueueMobileRow({ load }: { load: BillingLoad }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canCreateInvoice =
    load.billingReadiness === "Ready to invoice" && !load.invoice;
  const canMarkPaid =
    load.invoice && load.invoice.status !== "Paid" && !load.invoice.paidAt;
  const needsPod = load.billingReadiness === "Needs POD";
  const podDocument = load.documents.find((document) => document.type === "Pod");

  async function createInvoice() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const fd = new FormData();
      fd.append("amount", String(load.customerRate));
      fd.append("status", "SENT");
      fd.append("dueDate", dueDate.toISOString().slice(0, 10));
      await fetch(`/api/loads/${load.id}/invoice`, {
        method: "POST",
        body: fd,
      });
      setDone(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function markPaid() {
    if (submitting || !load.invoice) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", String(load.invoice.amount));
      fd.append("status", "PAID");
      await fetch(`/api/loads/${load.id}/invoice`, {
        method: "POST",
        body: fd,
      });
      setDone(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950 dark:text-slate-50">{load.shipper}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-500">
            {load.loadNumber}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{load.lane}</p>
        </div>
        <BillingStatusPill label={load.billingReadiness} />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
        <p>Invoice: {load.invoice?.status ?? "Not created"}</p>
        <p>Margin: {toCurrency(load.margin)}</p>
        <p>POD: {load.hasPod ? "Received" : "Needed"}</p>
        {podDocument?.downloadHref ? (
          <Link
            href={podDocument.downloadHref}
            target="_blank"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            Download POD
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        {done ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
            <CheckCheck className="h-3.5 w-3.5" />
            Saved
          </span>
        ) : canCreateInvoice ? (
          <button
            onClick={createInvoice}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ReceiptText className="h-3.5 w-3.5" />
            )}
            Create invoice
          </button>
        ) : needsPod ? (
          <Link
            href={`/loads/${load.id}?tab=documents`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-xs font-bold text-white"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            Upload POD
          </Link>
        ) : canMarkPaid ? (
          <button
            onClick={markPaid}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark paid
          </button>
        ) : null}
        <Link
          href={`/loads/${load.id}?tab=billing`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Open billing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function BillingStatusPill({ label }: { label: string }) {
  const className =
    label === "Ready to invoice"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
      : label === "Needs POD"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", className)}>
      {label}
    </span>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}
