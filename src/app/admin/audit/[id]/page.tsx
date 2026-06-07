import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClipboardList, ShieldCheck } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { requireInternalRole } from "@/lib/current-user";
import { getAuditLogDetailView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function AuditLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const log = await getAuditLogDetailView(id);

  if (!log) {
    notFound();
  }

  return (
    <InternalShell
      active="Admin Controls"
      eyebrow="Audit"
      title={log.action.replaceAll("_", " ")}
      description="Review the exact audited before and after payload for a sensitive action."
      action={{ label: "Back to Admin", href: "/admin" }}
    >
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Audit summary</p>
          </div>
          <div className="grid gap-4 p-5 text-sm">
            <Fact label="Action" value={log.action.replaceAll("_", " ")} />
            <Fact label="Entity" value={`${log.entityType}${log.entityId ? ` · ${log.entityId}` : ""}`} />
            <Fact label="User" value={log.userName} />
            <Fact label="Created" value={log.created} />
            <p className="rounded-md border border-slate-100 bg-slate-50 p-4 leading-6 text-slate-700">
              {log.summary}
            </p>
            <Link
              href="/admin"
              className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Return to audit log
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Payloads</p>
          </div>
          <div className="grid gap-4 p-5">
            <JsonPanel title="Before" value={log.beforeJson} />
            <JsonPanel title="After" value={log.afterJson} />
            <JsonPanel title="Metadata" value={log.metadata} />
          </div>
        </article>
      </section>
    </InternalShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-100">
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <pre className="max-h-[360px] overflow-auto bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}
