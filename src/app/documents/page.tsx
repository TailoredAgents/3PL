import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Files,
  Upload,
} from "lucide-react";

import {
  DocumentAutomationRunForm,
  DocumentCreateForm,
  DocumentExtractionControl,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import {
  getDocumentAutomationView,
  getDocumentCenterViews,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

type DocumentCenterItem = Awaited<ReturnType<typeof getDocumentCenterViews>>[number];
type DocumentAutomationView = Awaited<ReturnType<typeof getDocumentAutomationView>>;

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

function needsDocumentAttention(document: DocumentCenterItem) {
  const status = `${document.status} ${document.storageState} ${document.extractionStatus}`.toLowerCase();
  return (
    status.includes("needs review") ||
    status.includes("missing") ||
    status.includes("pending") ||
    status.includes("failed")
  );
}

function getDocumentCommand({
  documents,
  automation,
}: {
  documents: DocumentCenterItem[];
  automation: DocumentAutomationView;
}) {
  const attentionCount = documents.filter(needsDocumentAttention).length;

  if (automation.reviewCount > 0) {
    return {
      label: "Review extracted fields",
      detail: `${automation.reviewCount} document${automation.reviewCount === 1 ? "" : "s"} need human review before downstream records are changed.`,
      icon: AlertTriangle,
      className: "border-amber-100 bg-amber-50 text-amber-900",
    };
  }

  if (automation.pendingCount > 0 || automation.failedCount > 0) {
    return {
      label: "Run extraction queue",
      detail: `${automation.pendingCount} pending · ${automation.failedCount} failed. Run automation, then review exceptions first.`,
      icon: Bot,
      className: "border-sky-100 bg-sky-50 text-sky-900",
    };
  }

  if (attentionCount > 0) {
    return {
      label: "Clean up document exceptions",
      detail: `${attentionCount} document${attentionCount === 1 ? "" : "s"} have storage, status, or extraction signals that need attention.`,
      icon: AlertTriangle,
      className: "border-amber-100 bg-amber-50 text-amber-900",
    };
  }

  if (!documents.length) {
    return {
      label: "No document file started",
      detail: "Add BOLs, PODs, rate confirmations, invoices, COIs, W-9s, and customer audit documents as freight starts moving.",
      icon: Upload,
      className: "border-slate-100 bg-slate-50 text-slate-800",
    };
  }

  return {
    label: "Document control is clear",
    detail: "No extraction, storage, or review exceptions are currently waiting.",
    icon: CheckCircle2,
    className: "border-emerald-100 bg-emerald-50 text-emerald-900",
  };
}

export default async function DocumentsPage() {
  const [documents, automation] = await Promise.all([
    getDocumentCenterViews(),
    getDocumentAutomationView(),
  ]);
  const missingStorage = documents.filter(
    (document) => document.storageState === "Missing storage",
  );
  const podBol = documents.filter((document) =>
    ["Pod", "Bol"].includes(document.type),
  );
  const needsReview = documents.filter(needsDocumentAttention);
  const automationOpen =
    automation.pendingCount + automation.reviewCount + automation.failedCount;
  const command = getDocumentCommand({ documents, automation });
  const CommandIcon = command.icon;

  const metrics = [
    { icon: Files, label: "Controlled files", value: documents.length.toString(), helper: "Linked source of truth" },
    { icon: AlertTriangle, label: "Needs attention", value: needsReview.length.toString(), helper: "Review, storage, or extraction" },
    { icon: Bot, label: "AI work open", value: automationOpen.toString(), helper: "Pending, review, or failed" },
    { icon: FileCheck2, label: "Delivery docs", value: podBol.length.toString(), helper: "PODs and BOLs" },
  ];

  return (
    <InternalShell
      active="Documents"
      eyebrow="Operations"
      title="Documents"
      description="Central document control for PODs, BOLs, rate confirmations, invoices, audit uploads, and linked freight records."
      action={{ label: "Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <article className={`rounded-lg border p-5 shadow-sm ${command.className}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
                <CommandIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                  Document control priority
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{command.label}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                  {command.detail}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <DocumentStep label="Capture" value="Upload or link" />
                  <DocumentStep label="Extract" value={`${automation.pendingCount} pending`} />
                  <DocumentStep label="Review" value={`${automation.reviewCount} waiting`} />
                </div>
              </div>
            </div>
            <div className="min-w-[210px] rounded-lg bg-white/75 p-3 shadow-sm">
              <DocumentAutomationRunForm />
            </div>
          </div>
        </article>

        <details className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50">
                <Upload className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Add document</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Link paperwork to a load, carrier, shipper, or quote.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-400 group-open:hidden">Expand</span>
            <span className="hidden text-xs font-black text-slate-400 group-open:inline">Collapse</span>
          </summary>
          <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-3">
            <CaptureHint label="Freight" value="BOL, POD, rate confirmation" />
            <CaptureHint label="Compliance" value="COI, W-9, agreement" />
            <CaptureHint label="Finance" value="Invoice, audit upload" />
          </div>
          <div className="border-t border-slate-100 p-5">
            <DocumentCreateForm />
          </div>
        </details>
      </section>

      {missingStorage.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {missingStorage.length} document{missingStorage.length === 1 ? "" : "s"} need storage configuration before download.
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-black text-slate-800">Automation review desk</p>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Automation can read documents, but extracted fields stay behind review before load, billing, payable, or compliance records change.
            </p>
            {automation.latestRun ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Latest run: {automation.latestRun.status} · {automation.latestRun.created} · {automation.latestRun.summary}
              </p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                No document automation batch has run yet.
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <AutomationStat label="Pending extraction" value={automation.pendingCount} tone="sky" />
          <AutomationStat label="Needs review" value={automation.reviewCount} tone="amber" />
          <AutomationStat label="Failed extraction" value={automation.failedCount} tone="red" />
          <AutomationStat label="Completed" value={automation.completedCount} tone="emerald" />
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {automation.queue.length ? (
            automation.queue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.type} · {item.relatedLabel}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${automationPriorityClass(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DocumentPill label={item.extractionStatus} />
                  <DocumentPill label={item.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              No pending or review-needed documents are currently queued.
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Files className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm font-black text-slate-800">Document register</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                One searchable source of truth for freight, billing, compliance, and audit paperwork.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            {documents.length}
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <Th>Document</Th>
                <Th>Related record</Th>
                <Th>Storage</Th>
                <Th>AI extraction</Th>
                <Th>Uploaded</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((document) => (
                <DocumentTableRow key={document.id} document={document} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {documents.map((document) => (
            <DocumentMobileCard key={document.id} document={document} />
          ))}
        </div>

        {!documents.length ? (
          <div className="border-t border-slate-100 px-5 py-8 text-center">
            <Files className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              No documents have been logged yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Expand Add document above to attach the first BOL, POD, invoice, rate confirmation, COI, or W-9.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Guardrail
          icon={FileCheck2}
          title="Attach to the right record"
          text="Every document should point to the load, carrier, shipper, or quote it supports."
        />
        <Guardrail
          icon={Bot}
          title="Review before applying"
          text="AI extraction can assist, but field changes stay behind human review."
        />
        <Guardrail
          icon={Download}
          title="Keep files retrievable"
          text="PODs, BOLs, invoices, COIs, and W-9s should remain downloadable for audit."
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
    <article className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${accent.border}`}>
      <div className="p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function DocumentStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function CaptureHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function DocumentTableRow({ document }: { document: DocumentCenterItem }) {
  return (
    <tr className="align-top hover:bg-slate-50" id={document.id}>
      <Td>
        <div className="flex gap-2">
          <FileText className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-950">{document.fileName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {document.type} · {document.mimeType} · {document.fileSize}
            </p>
          </div>
        </div>
      </Td>
      <Td>
        {document.relatedHref ? (
          <Link
            href={document.relatedHref}
            className="font-semibold text-slate-800 hover:text-emerald-700"
          >
            {document.relatedLabel}
          </Link>
        ) : (
          <span className="font-medium text-slate-500">{document.relatedLabel}</span>
        )}
        <p className="mt-1 text-xs text-slate-500">{document.shipper}</p>
      </Td>
      <Td>
        <DocumentPill label={document.storageState} />
        <p className="mt-1 text-xs text-slate-500">{document.source}</p>
      </Td>
      <Td>
        <DocumentPill label={document.extractionStatus} />
        <p className="mt-1 text-xs text-slate-500">{document.status}</p>
        {document.extractedText ? (
          <p
            className="mt-1 max-w-[220px] truncate text-[10px] text-slate-400"
            title={document.extractedText}
          >
            {document.extractedText.slice(0, 70)}
            {document.extractedText.length > 70 ? "..." : ""}
          </p>
        ) : null}
        {document.extractedFields && Object.keys(document.extractedFields).length > 0 ? (
          <span className="mt-0.5 inline-block rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-800">
            Structured
          </span>
        ) : null}
      </Td>
      <Td>
        <p className="font-medium text-slate-700">{document.created}</p>
        <p className="mt-1 text-xs text-slate-500">{document.uploadedBy}</p>
      </Td>
      <Td>
        <div className="flex flex-col gap-2">
          {document.downloadHref ? (
            <Link
              href={document.downloadHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Link>
          ) : (
            <span className="text-xs font-semibold text-slate-400">No file</span>
          )}
          <DocumentExtractionControl
            documentId={document.id}
            extractionStatus={document.extractionStatus}
            extractedText={document.extractedText}
            extractedFields={document.extractedFields}
          />
        </div>
      </Td>
    </tr>
  );
}

function DocumentMobileCard({ document }: { document: DocumentCenterItem }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4" id={document.id}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{document.fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {document.type} · {document.storageState}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DocumentPill label={document.extractionStatus} />
            <DocumentPill label={document.status} />
          </div>
        </div>
        {document.downloadHref ? (
          <Link
            href={document.downloadHref}
            target="_blank"
            className="rounded-md bg-slate-900 p-2 text-white"
          >
            <Download className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {document.relatedHref ? (
        <Link
          href={document.relatedHref}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
        >
          {document.relatedLabel}
          <ExternalLink className="h-3 w-3" />
        </Link>
      ) : (
        <p className="mt-3 text-xs text-slate-500">{document.relatedLabel}</p>
      )}
      <div className="mt-3">
        <DocumentExtractionControl
          documentId={document.id}
          extractionStatus={document.extractionStatus}
          extractedText={document.extractedText}
          extractedFields={document.extractedFields}
        />
      </div>
    </div>
  );
}

function AutomationStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red" | "sky";
}) {
  const className =
    tone === "red"
      ? "border-red-100 bg-red-50 text-red-800"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50 text-amber-800"
        : tone === "emerald"
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-sky-100 bg-sky-50 text-sky-800";

  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
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
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
        </div>
      </div>
    </article>
  );
}

function automationPriorityClass(priority: "High" | "Medium" | "Low") {
  if (priority === "High") return "bg-red-50 text-red-700";
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function DocumentPill({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const className =
    normalized.includes("stored") ||
    normalized.includes("active") ||
    normalized.includes("completed")
      ? "bg-emerald-50 text-emerald-800"
      : normalized.includes("missing") ||
          normalized.includes("needs review") ||
          normalized.includes("pending") ||
          normalized.includes("failed")
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}
