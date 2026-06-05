import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import {
  AgentRunApproveForm,
  AgentRunRetryForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getAiCommandCenterView, type AiAgentRunView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const commandCenter = await getAiCommandCenterView();
  const metrics = [
    {
      label: "Awaiting approval",
      value: commandCenter.metrics.needsApproval,
      note: "Agent output waiting on a person before action.",
      icon: ClipboardCheck,
    },
    {
      label: "Failed runs",
      value: commandCenter.metrics.failed,
      note: "Runs that can be retried after reviewing context.",
      icon: AlertTriangle,
    },
    {
      label: "Approved",
      value: commandCenter.metrics.completed,
      note: "Recommendations accepted into the workflow.",
      icon: CheckCircle2,
    },
    {
      label: "Avg confidence",
      value: commandCenter.metrics.averageConfidence,
      note: `${commandCenter.metrics.total} recent runs reviewed.`,
      icon: Sparkles,
    },
  ];

  return (
    <InternalShell
      active="AI Command Center"
      eyebrow="AI operations"
      title="AI Command Center"
      description="Review agent recommendations, approve human-checked output, retry failed work, and keep automation visible before it acts on customers or carriers."
      action={{ label: "Run from a record", href: "/dashboard#ai" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <metric.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Approval queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Recommendations needing review
              </h2>
            </div>
            <Bot className="h-6 w-6 text-slate-400" />
          </div>

          <div className="mt-6 grid gap-4">
            {commandCenter.approvalQueue.length ? (
              commandCenter.approvalQueue.map((run) => (
                <RunReviewCard
                  key={run.id}
                  run={run}
                  action={<AgentRunApproveForm runId={run.id} />}
                />
              ))
            ) : (
              <EmptyState message="No AI recommendations are waiting for approval." />
            )}
          </div>
        </article>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">
                Retry queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Failed agent work</h2>
            </div>
            <RefreshCcw className="h-6 w-6 text-slate-400" />
          </div>

          <div className="mt-6 grid gap-4">
            {commandCenter.failedRuns.length ? (
              commandCenter.failedRuns.map((run) => (
                <RunReviewCard
                  key={run.id}
                  run={run}
                  tone="danger"
                  action={<AgentRunRetryForm runId={run.id} />}
                />
              ))
            ) : (
              <EmptyState message="No failed AI agent runs need attention." />
            )}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Run explorer
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Recent AI work</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Track what each agent recommended, where it belongs, and what needs
            to happen next.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-md border border-slate-100">
          {commandCenter.recentRuns.length ? (
            <div className="divide-y divide-slate-100">
              {commandCenter.recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="grid gap-4 bg-slate-50 p-4 lg:grid-cols-[220px_1fr_150px_auto]"
                >
                  <div>
                    <p className="font-semibold">{run.agentName}</p>
                    <p className="mt-1 text-sm text-slate-600">{run.created}</p>
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-slate-700">
                      {run.summary}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                      Next: {run.nextAction}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {run.relatedEntityType}
                    </p>
                    <p className="mt-1">
                      {run.confidence === null
                        ? "Confidence n/a"
                        : `${Math.round(run.confidence * 100)}% confidence`}
                    </p>
                    <p className="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      {run.status}
                    </p>
                  </div>
                  <Link
                    href={getAgentRunHref(
                      run.relatedEntityType,
                      run.relatedEntityId,
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
                  >
                    Open
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No AI agent runs have been logged yet." />
          )}
        </div>
      </section>
    </InternalShell>
  );
}

function RunReviewCard({
  run,
  action,
  tone = "default",
}: {
  run: AiAgentRunView;
  action: ReactNode;
  tone?: "default" | "danger";
}) {
  const badgeClass =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{run.agentName}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
              {run.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {run.relatedEntityType} | {run.created}
          </p>
        </div>
        <Link
          href={getAgentRunHref(run.relatedEntityType, run.relatedEntityId)}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
        >
          Open record
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{run.summary}</p>
      {run.errorMessage ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {run.errorMessage}
        </p>
      ) : null}
      <p className="mt-3 text-sm font-semibold text-emerald-800">
        Next: {run.nextAction}
      </p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
      {message}
    </div>
  );
}

function getAgentRunHref(entityType: string, id: string) {
  if (entityType === "Lead") {
    return `/leads/${id}`;
  }

  if (entityType === "QuoteRequest") {
    return `/quote-requests/${id}`;
  }

  if (entityType === "Load") {
    return `/loads/${id}`;
  }

  if (entityType === "Carrier") {
    return `/carriers/${id}`;
  }

  return "/agents";
}
