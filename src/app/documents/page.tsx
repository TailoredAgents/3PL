import Link from "next/link";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Files,
  Upload,
} from "lucide-react";

import { DocumentCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getDocumentCenterViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

export default async function DocumentsPage() {
  const documents = await getDocumentCenterViews();
  const downloadable = documents.filter((document) => document.downloadHref);
  const missingStorage = documents.filter(
    (document) => document.storageState === "Missing storage",
  );
  const needsReview = documents.filter(
    (document) => document.status === "Needs Review",
  );
  const podBol = documents.filter((document) =>
    ["Pod", "Bol"].includes(document.type),
  );
  const metrics = [
    { icon: Files, label: "Documents", value: documents.length.toString() },
    { icon: Download, label: "Downloadable", value: downloadable.length.toString() },
    { icon: AlertTriangle, label: "Needs review", value: needsReview.length.toString() },
    { icon: FileCheck2, label: "POD / BOL", value: podBol.length.toString() },
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
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[index].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[index].icon}`}>
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

      {missingStorage.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {missingStorage.length} document{missingStorage.length === 1 ? "" : "s"} need storage configuration before download.
        </section>
      )}

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Files className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Document register</p>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {documents.length}
            </span>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1000px] text-left text-sm">
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
                  <tr key={document.id} className="align-top hover:bg-slate-50">
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
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-700">{document.created}</p>
                      <p className="mt-1 text-xs text-slate-500">{document.uploadedBy}</p>
                    </Td>
                    <Td>
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
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {documents.map((document) => (
              <div key={document.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{document.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {document.type} · {document.storageState}
                    </p>
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
              </div>
            ))}
          </div>

          {!documents.length && (
            <div className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-400">
              No documents have been logged yet.
            </div>
          )}
        </article>

        <aside className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Upload className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Add document</p>
          </div>
          <div className="p-5">
            <DocumentCreateForm />
          </div>
        </aside>
      </section>
    </InternalShell>
  );
}

function DocumentPill({ label }: { label: string }) {
  const className =
    label === "Stored" || label === "Active" || label === "Completed"
      ? "bg-emerald-50 text-emerald-800"
      : label === "Missing storage" || label === "Needs Review"
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}
