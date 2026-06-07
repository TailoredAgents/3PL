"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCheck, Loader2 } from "lucide-react";

import { cn, toCurrency } from "@/lib/utils";

type CarrierInvoiceItem = {
  id: string;
  loadId: string;
  loadNumber: string;
  carrierName: string;
  lane: string;
  delivery: string;
  invoiceNumber: string | null;
  amount: number;
  agreedRate: number | null;
  status: string;
  dueDate: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  paidAt: string | null;
  paidByName: string | null;
  isOverdue: boolean;
  disputeReason?: string | null;
  approvalOwner?: string | null;
  paymentBatch?: string | null;
  remittanceNotes?: string | null;
  quickPayMetadata?: string | null;
  invoiceDocument: {
    fileName: string;
    downloadHref: string | null;
  } | null;
  rateConfirmationDocument: {
    fileName: string;
    downloadHref: string | null;
  } | null;
};

const STATUS_CLASS: Record<string, string> = {
  Received: "bg-sky-50 text-sky-800",
  Matched: "bg-slate-100 text-slate-700",
  Approved: "bg-emerald-50 text-emerald-800",
  Paid: "bg-lime-50 text-lime-800",
  Disputed: "bg-red-50 text-red-800",
};

export function PayablesTableRow({ invoice }: { invoice: CarrierInvoiceItem }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const variance =
    invoice.agreedRate != null ? invoice.amount - invoice.agreedRate : null;

  async function updateStatus(status: string, paymentMethod?: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("status", status);
      if (paymentMethod) fd.append("paymentMethod", paymentMethod);
      const response = await fetch(`/api/carrier-invoices/${invoice.id}`, { method: "PATCH", body: fd });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update payable.");
      }
      setDone(status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update payable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <tr className="align-top hover:bg-slate-50">
      <Td>
        <p className="font-semibold text-slate-900">{invoice.carrierName}</p>
        <p className="mt-0.5 text-xs text-slate-500">{invoice.loadNumber}</p>
        {invoice.invoiceNumber && (
          <p className="mt-0.5 text-xs text-slate-400">Inv# {invoice.invoiceNumber}</p>
        )}
      </Td>
      <Td>
        <p className="font-medium text-slate-800">{invoice.lane}</p>
        <p className="mt-0.5 text-xs text-slate-500">Del {invoice.delivery}</p>
      </Td>
      <Td>
        <p className="font-bold text-slate-900">{toCurrency(invoice.amount)}</p>
        {invoice.agreedRate != null && (
          <p className="mt-0.5 text-xs text-slate-500">
            Agreed {toCurrency(invoice.agreedRate)}
          </p>
        )}
        {variance != null && variance !== 0 && (
          <p className={cn("mt-0.5 text-xs font-semibold", variance > 0 ? "text-red-600" : "text-emerald-600")}>
            {variance > 0 ? "+" : ""}{toCurrency(variance)} vs rate con
          </p>
        )}
        <DocumentLink label="Invoice doc" href={invoice.invoiceDocument?.downloadHref} />
        <DocumentLink label="Rate con" href={invoice.rateConfirmationDocument?.downloadHref} />
      </Td>
      <Td>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_CLASS[invoice.status] ?? "bg-slate-100 text-slate-700")}>
          {invoice.status}
        </span>
        {invoice.approvedByName || invoice.approvalOwner ? (
          <p className="mt-0.5 text-[10px] text-slate-500">Approved by: {invoice.approvedByName ?? invoice.approvalOwner}</p>
        ) : null}
        {invoice.paidByName ? (
          <p className="mt-0.5 text-[10px] text-slate-500">Paid by: {invoice.paidByName}</p>
        ) : null}
        {invoice.disputeReason ? (
          <p className="mt-0.5 text-[10px] font-semibold text-red-600">Disputed: {invoice.disputeReason}</p>
        ) : null}
      </Td>
      <Td>
        {invoice.paidAt ? (
          <p className="text-xs font-semibold text-emerald-700">Paid {invoice.paidAt}</p>
        ) : invoice.dueDate ? (
          <p className={cn("text-xs font-semibold", invoice.isOverdue ? "text-red-600" : "text-slate-600")}>
            {invoice.isOverdue ? "Overdue · " : "Due "}{invoice.dueDate}
          </p>
        ) : (
          <p className="text-xs text-slate-400">No due date</p>
        )}
        {invoice.paymentBatch ? (
          <p className="mt-0.5 text-[10px] text-emerald-700">Batch: {invoice.paymentBatch}</p>
        ) : null}
      </Td>
      <Td>
        <div className="flex flex-col gap-1.5">
          {done ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <CheckCheck className="h-3 w-3" /> Saved
            </span>
          ) : invoice.status === "Received" || invoice.status === "Matched" ? (
            <button
              onClick={() => updateStatus("APPROVED")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Approve
            </button>
          ) : invoice.status === "Approved" ? (
            <button
              onClick={() => updateStatus("PAID", "ACH")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Mark paid
            </button>
          ) : null}
          {!done && invoice.status !== "Paid" && invoice.status !== "Disputed" && (
            <button
              onClick={() => updateStatus("DISPUTED")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Dispute
            </button>
          )}
          <Link
            href={`/loads/${invoice.loadId}?tab=billing`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700"
          >
            Load <ArrowRight className="h-3 w-3" />
          </Link>
          {error ? (
            <p className="max-w-[150px] text-[10px] font-semibold leading-4 text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </Td>
    </tr>
  );
}

export function PayablesMobileRow({ invoice }: { invoice: CarrierInvoiceItem }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: string, paymentMethod?: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("status", status);
      if (paymentMethod) fd.append("paymentMethod", paymentMethod);
      const response = await fetch(`/api/carrier-invoices/${invoice.id}`, { method: "PATCH", body: fd });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update payable.");
      }
      setDone(status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update payable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{invoice.carrierName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{invoice.loadNumber} · {invoice.lane}</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_CLASS[invoice.status] ?? "bg-slate-100 text-slate-700")}>
          {invoice.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="font-bold text-slate-900">{toCurrency(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Due</p>
          <p className={cn("font-semibold", invoice.isOverdue ? "text-red-600" : "text-slate-700")}>
            {invoice.paidAt ? `Paid ${invoice.paidAt}` : invoice.dueDate ?? "—"}
          </p>
          {invoice.paymentBatch ? (
            <p className="text-[10px] text-emerald-700">Batch: {invoice.paymentBatch}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <DocumentLink label="Invoice doc" href={invoice.invoiceDocument?.downloadHref} />
        <DocumentLink label="Rate con" href={invoice.rateConfirmationDocument?.downloadHref} />
      </div>
      <div className="mt-3 flex gap-2">
        {done ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <CheckCheck className="h-3 w-3" /> Saved
          </span>
        ) : invoice.status === "Received" || invoice.status === "Matched" ? (
          <button
            onClick={() => updateStatus("APPROVED")}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Approve
          </button>
        ) : invoice.status === "Approved" ? (
          <button
            onClick={() => updateStatus("PAID", "ACH")}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Mark paid
          </button>
        ) : null}
        <Link
          href={`/loads/${invoice.loadId}?tab=billing`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Open load <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {invoice.approvedByName || invoice.approvalOwner || invoice.paidByName ? (
        <p className="mt-2 text-[10px] text-slate-500">
          {invoice.approvedByName || invoice.approvalOwner
            ? `Approved by ${invoice.approvedByName ?? invoice.approvalOwner}`
            : ""}
          {invoice.paidByName ? ` · Paid by ${invoice.paidByName}` : ""}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function DocumentLink({
  label,
  href,
}: {
  label: string;
  href: string | null | undefined;
}) {
  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      target="_blank"
      className="mt-1 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-900"
    >
      {label}
    </Link>
  );
}
