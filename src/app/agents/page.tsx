import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  History,
  ListChecks,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  AgentRunApproveForm,
  AgentPromptTemplateForm,
  AgentRunRejectForm,
  AgentRunRetryForm,
  DailyBriefGenerateForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { isClerkAuthConfigured } from "@/lib/auth";
import {
  getAiCommandCenterView,
  getDailyBriefView,
  type AiAgentRunView,
} from "@/lib/crm";
import { getCurrentInternalUser } from "@/lib/current-user";
import { getAgentPromptTemplates } from "@/lib/settings";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-red-400", icon: "bg-red-50 text-red-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

export default async function AgentsPage() {
  const [commandCenter, promptTemplates, currentUser, dailyBrief] = await Promise.all([
    getAiCommandCenterView(),
    getAgentPromptTemplates(),
    getCurrentInternalUser(),
    getDailyBriefView(),
  ]);
  const clerkEnabled = isClerkAuthConfigured();
  const canManagePrompts =
    !clerkEnabled ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "ADMIN";

  const metrics = [
    { label: "Awaiting approval", value: commandCenter.metrics.needsApproval, icon: ClipboardCheck },
    { label: "Failed runs", value: commandCenter.metrics.failed, icon: AlertTriangle },
    { label: "Approved", value: commandCenter.metrics.completed, icon: CheckCircle2 },
    { label: "Avg confidence", value: commandCenter.metrics.averageConfidence, icon: Sparkles },
  ];

  return (
    <InternalShell
      active="AI Command Center"
      eyebrow="Admin / AI"
      title="AI Command Center"
      description="Review agent recommendations, approve output, retry failed work, and keep automation visible."
      action={{ label: "Run from a record", href: "/dashboard#ai" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, i) => (
          <article
            key={metric.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {metric.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Generated daily brief */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">Generated daily brief</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{dailyBrief.summary}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {dailyBrief.status} · {dailyBrief.generatedAt}
              {dailyBrief.confidence === null
                ? ""
                : ` · ${Math.round(dailyBrief.confidence * 100)}% confidence`}
            </p>
          </div>
          <div className="min-w-[180px]">
            <DailyBriefGenerateForm />
          </div>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {dailyBrief.actions.length ? (
            dailyBrief.actions.slice(0, 6).map((action, index) => (
              <Link
                key={`${action.href}-${action.title}-${index}`}
                href={action.href}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      {index + 1}. {action.category}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{action.title}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dailyBriefPriorityClass(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.detail}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  {action.nextAction}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState message="No daily brief actions are currently flagged." />
          )}
        </div>
      </article>

      {/* Management snapshot + Exception dashboard */}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Management snapshot</p>
            </div>
            <span className="text-xs text-slate-400">Daily brief</span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {commandCenter.dailyBrief.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-md border p-4 hover:-translate-y-0.5 hover:shadow-md ${getBriefClass(item.tone)}`}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-3xl font-bold">{item.value}</p>
                <p className="mt-2 text-xs leading-5">{item.detail}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-slate-700">Work that needs attention</p>
            </div>
            <span className="text-xs text-slate-400">Exceptions</span>
          </div>
          <div className="grid gap-3 p-4">
            {commandCenter.exceptions.length ? (
              commandCenter.exceptions.map((exception) => (
                <Link
                  key={exception.id}
                  href={exception.href}
                  className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md lg:grid-cols-[140px_1fr_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{exception.type}</p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getSeverityClass(exception.severity)}`}>
                      {exception.severity}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{exception.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{exception.detail}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Link>
              ))
            ) : (
              <EmptyState message="No operating exceptions are currently flagged." />
            )}
          </div>
        </article>
      </section>

      {/* Automation guardrails */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-700">Automation guardrails</p>
          </div>
          <span className="text-xs text-slate-400">Phase 10.1</span>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <Guardrail
            title="Approval gates"
            detail="Money, compliance, marketplace, booking, and outbound contact actions stay review-first."
          />
          <Guardrail
            title="Prompt snapshots"
            detail="Each run stores the prompt version and control policy used when the recommendation was created."
          />
          <Guardrail
            title="Auditable decisions"
            detail="Approvals and rejections capture reviewer notes, timestamps, and reviewer identity when auth is configured."
          />
        </div>
      </article>

      {/* Approval queue + Retry queue */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Recommendations needing review</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {commandCenter.approvalQueue.length}
            </span>
          </div>
          <div className="grid gap-3 p-4">
            {commandCenter.approvalQueue.length ? (
              commandCenter.approvalQueue.map((run) => (
                <RunReviewCard
                  key={run.id}
                  run={run}
                  action={
                    <div className="grid gap-3 md:grid-cols-2">
                      <AgentRunApproveForm runId={run.id} />
                      <AgentRunRejectForm runId={run.id} />
                    </div>
                  }
                />
              ))
            ) : (
              <EmptyState message="No AI recommendations are waiting for approval." />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-slate-700">Failed agent work</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {commandCenter.failedRuns.length}
            </span>
          </div>
          <div className="grid gap-3 p-4">
            {commandCenter.failedRuns.length ? (
              commandCenter.failedRuns.map((run) => (
                <RunReviewCard key={run.id} run={run} tone="danger" action={<AgentRunRetryForm runId={run.id} />} />
              ))
            ) : (
              <EmptyState message="No failed AI agent runs need attention." />
            )}
          </div>
        </article>
      </section>

      {/* Run explorer */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Recent AI work</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {commandCenter.recentRuns.length}
          </span>
        </div>
        {commandCenter.recentRuns.length ? (
          <div className="divide-y divide-slate-100">
            {commandCenter.recentRuns.map((run) => (
              <div
                key={run.id}
                className="grid gap-4 p-4 lg:grid-cols-[200px_1fr_140px_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{run.agentName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{run.created}</p>
                </div>
                <div>
                  <p className="text-sm leading-6 text-slate-700">{run.summary}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">Next: {run.nextAction}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p className="text-xs font-semibold text-slate-900">{run.relatedEntityType}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {run.confidence === null
                      ? "Confidence n/a"
                      : `${Math.round(run.confidence * 100)}% confidence`}
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {run.status}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    {run.riskLevel} risk · v{run.promptVersion ?? "n/a"}
                  </p>
                </div>
                <Link
                  href={getAgentRunHref(run.relatedEntityType, run.relatedEntityId)}
                  className="inline-flex items-center gap-1.5 self-start rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No AI agent runs have been logged yet." />
        )}
      </article>

      {/* Prompt templates */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Prompt templates</p>
          </div>
          <span className="text-xs text-slate-400">Controls future Grok agent runs</span>
        </div>
        {canManagePrompts ? (
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {promptTemplates.map((template) => (
              <details
                key={template.agentName}
                className="group overflow-hidden rounded-md border border-slate-100 bg-slate-50 open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{template.agentName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{template.task}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    template.isCustomized
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {template.isCustomized ? "Custom" : "Default"}
                  </span>
                </summary>
                <div className="border-t border-slate-100 p-4">
                  <div className="mb-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Version {template.version} · {template.updated}
                    </p>
                    <p>
                      {template.changedBy
                        ? `Changed by ${template.changedBy}`
                        : "No saved prompt history yet."}
                    </p>
                  </div>
                  <AgentPromptTemplateForm
                    agentName={template.agentName}
                    systemPrompt={template.systemPrompt}
                    task={template.task}
                    placeholderNextAction={template.placeholderNextAction}
                  />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="m-4 rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Prompt template editing is limited to owner and admin users.
          </p>
        )}
      </article>

      {/* Prompt history */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Prompt version history</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {commandCenter.promptHistory.length}
          </span>
        </div>
        {commandCenter.promptHistory.length ? (
          <div className="divide-y divide-slate-100">
            {commandCenter.promptHistory.map((version) => (
              <div
                key={version.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[220px_1fr_180px]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{version.agentName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Version {version.version}</p>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  {version.changeReason ?? "Prompt saved without a change reason."}
                </p>
                <div className="text-xs leading-5 text-slate-500">
                  <p>{version.created}</p>
                  <p>{version.changedBy ?? "System or local mode"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Prompt history will appear after the next prompt save." />
        )}
      </article>
    </InternalShell>
  );
}

function getBriefClass(tone: "default" | "warning" | "danger") {
  if (tone === "danger") return "border-red-100 bg-red-50 text-red-950";
  if (tone === "warning") return "border-amber-100 bg-amber-50 text-amber-950";
  return "border-slate-100 bg-slate-50 text-slate-950";
}

function getSeverityClass(severity: "High" | "Medium" | "Low") {
  if (severity === "High") return "bg-red-50 text-red-700";
  if (severity === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function dailyBriefPriorityClass(priority: "High" | "Medium" | "Low") {
  if (priority === "High") return "bg-red-50 text-red-700";
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function Guardrail({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
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
    tone === "danger" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{run.agentName}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {run.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {run.relatedEntityType} · {run.created}
          </p>
        </div>
        <Link
          href={getAgentRunHref(run.relatedEntityType, run.relatedEntityId)}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
        >
          Open <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{run.summary}</p>
      <div className="mt-3 grid gap-2 rounded-md border border-slate-100 bg-white p-3 text-xs leading-5 text-slate-600 md:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-900">Control policy</p>
          <p>{run.riskLevel} risk · {run.automationMode}</p>
          <p>{run.approvalRequired ? "Approval required" : "No approval required"}</p>
          <p>Prompt version {run.promptVersion ?? "n/a"}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Gated actions</p>
          <p>
            {run.gatedActions.length
              ? run.gatedActions.join(", ")
              : "No gated actions stored."}
          </p>
        </div>
      </div>
      {run.errorMessage && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {run.errorMessage}
        </p>
      )}
      <p className="mt-2 text-xs font-semibold text-emerald-700">Next: {run.nextAction}</p>
      {run.reviewNotes || run.reviewedBy || run.reviewedAt ? (
        <p className="mt-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
          {run.reviewNotes ?? "Reviewed without notes."}
          {run.reviewedBy || run.reviewedAt
            ? ` Reviewed ${run.reviewedAt ?? ""}${run.reviewedBy ? ` by ${run.reviewedBy}` : ""}.`
            : ""}
        </p>
      ) : null}
      <div className="mt-3">{action}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-slate-400">{message}</p>
  );
}

function getAgentRunHref(entityType: string, id: string) {
  if (entityType === "Lead") return `/leads/${id}`;
  if (entityType === "QuoteRequest") return `/quote-requests/${id}`;
  if (entityType === "Load") return `/loads/${id}`;
  if (entityType === "Carrier") return `/carriers/${id}`;
  return "/agents";
}
