import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Plug,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { requireInternalRole } from "@/lib/current-user";
import {
  getIntegrationsOverview,
  type IntegrationLogView,
  type ProviderStatus,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

const PROVIDER_ACCENTS: Record<string, string> = {
  DAT: "border-l-sky-400",
  TRUCKSTOP: "border-l-cyan-400",
  TWILIO: "border-l-emerald-400",
  RESEND: "border-l-violet-400",
  XAI: "border-l-slate-900",
  FMCSA: "border-l-amber-400",
  HERE: "border-l-lime-400",
  EIA: "border-l-orange-400",
  CARRIEROK: "border-l-red-400",
};

export default async function IntegrationsPage() {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const { providers, totalLogs, failureRate, recentGlobalLogs } =
    await getIntegrationsOverview();
  const configuredProviders = providers.filter((provider) => provider.configured).length;
  const missingProviders = providers.length - configuredProviders;
  const failedProviders = providers.filter((provider) => provider.failureCount > 0).length;

  return (
    <InternalShell
      active="Integrations"
      eyebrow="Admin"
      title="Integrations"
      description="Monitor provider credentials, health checks, webhook activity, and marketplace/API logs in one place."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Plug}
          label="Providers"
          value={providers.length.toString()}
          detail={`${configuredProviders} connected`}
          tone="sky"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Configured"
          value={configuredProviders.toString()}
          detail={`${missingProviders} missing keys`}
          tone={missingProviders ? "amber" : "emerald"}
        />
        <MetricCard
          icon={RefreshCw}
          label="Recent logs"
          value={totalLogs.toString()}
          detail={`Failure rate ${failureRate}`}
          tone="violet"
        />
        <MetricCard
          icon={AlertCircle}
          label="Provider issues"
          value={failedProviders.toString()}
          detail="With recent failures"
          tone={failedProviders ? "red" : "emerald"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <article className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Health summary
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Provider readiness is tracked before automation depends on it.
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Health checks write to integration logs. DAT and Truckstop retry controls stay
                tied to a load ID so marketplace capacity and posting work can be rerun without
                opening backend tooling.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <ServerCog className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Credential source
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Keys live in Render environment variables.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This page reports whether keys are present and whether provider calls are
                succeeding. Secrets are not stored in the database.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {providers.map((provider) => (
          <ProviderCard key={provider.name} provider={provider} />
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Integration log
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Recent cross-provider activity
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {recentGlobalLogs.length} latest entries
          </span>
        </div>
        {recentGlobalLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <RefreshCw className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No integration logs yet.
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-slate-400">
              Activity will appear here when marketplace searches, load posts, webhooks,
              enrichment calls, or health checks create log entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-sm">
            <table className="min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Message / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGlobalLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {log.created}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{log.provider}</td>
                    <td className="px-4 py-3 text-slate-600">{log.action}</td>
                    <td className="px-4 py-3">
                      <LogStatusBadge status={log.status} />
                    </td>
                    <td
                      className="max-w-[420px] truncate px-4 py-3 text-xs text-slate-600"
                      title={log.error || log.message}
                    >
                      {log.error ? (
                        <span className="text-red-600">Error: {log.error}</span>
                      ) : (
                        log.message
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="rounded-lg border border-slate-100 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
        <p className="font-bold text-slate-900">What this page is for</p>
        <p className="mt-1">
          Use this as the owner/admin view for external service readiness. Operational users
          should work inside Load Board, Communications, Quotes, Carriers, and AI Command
          Center; this page confirms the connected providers behind those workflows are ready.
        </p>
      </aside>
    </InternalShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Plug;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald" | "red" | "sky" | "violet";
}) {
  const toneClasses = {
    amber: {
      card: "border-l-amber-400",
      icon: "bg-amber-50 text-amber-700",
    },
    emerald: {
      card: "border-l-emerald-400",
      icon: "bg-emerald-50 text-emerald-700",
    },
    red: {
      card: "border-l-red-400",
      icon: "bg-red-50 text-red-700",
    },
    sky: {
      card: "border-l-sky-400",
      icon: "bg-sky-50 text-sky-700",
    },
    violet: {
      card: "border-l-violet-400",
      icon: "bg-violet-50 text-violet-700",
    },
  }[tone];

  return (
    <div
      className={`rounded-lg border border-l-4 border-slate-100 bg-white p-5 shadow-sm ${toneClasses.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">{detail}</p>
    </div>
  );
}

function ProviderCard({ provider }: { provider: ProviderStatus }) {
  const accent = PROVIDER_ACCENTS[provider.key ?? ""] ?? "border-l-slate-300";
  const isMarketplace = provider.key === "DAT" || provider.key === "TRUCKSTOP";

  return (
    <article className={`overflow-hidden rounded-lg border border-l-4 border-slate-100 bg-white shadow-md shadow-slate-950/5 ${accent}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
            <Plug className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black text-slate-950">{provider.name}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-400">
                {provider.envKey ?? "No env key"}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">{provider.description}</p>
          </div>
        </div>
        <ProviderStatusBadge configured={provider.configured} />
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <ProviderFact
            label="Last success"
            value={provider.lastSuccess ?? "Never"}
            tone="emerald"
          />
          <ProviderFact
            label="Last failure"
            value={provider.lastFailure ?? "None"}
            tone={provider.lastFailure ? "red" : "slate"}
          />
          <ProviderFact
            label="Activity"
            value={`${provider.recentCount} logs`}
            tone={provider.failureCount ? "amber" : "slate"}
            detail={`${provider.successCount} success / ${provider.failureCount} failed`}
          />
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Provider actions
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Health checks and workflow shortcuts for this provider.
              </p>
            </div>
            <TestHealthForm provider={provider} />
          </div>
          <ProviderLinks provider={provider} />
          {isMarketplace ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <RetryProviderForm
                provider={provider}
                action="retry-capacity"
                label="Retry capacity"
              />
              <RetryProviderForm
                provider={provider}
                action="retry-post"
                label="Retry post"
              />
            </div>
          ) : null}
          {isMarketplace ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Payload mapping details are pending account documentation.
            </p>
          ) : null}
        </div>

        <RecentProviderLogs logs={provider.recentLogs} />
      </div>
    </article>
  );
}

function ProviderStatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
        configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {configured ? "Connected" : "Missing key"}
    </span>
  );
}

function ProviderFact({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: "amber" | "emerald" | "red" | "slate";
}) {
  const toneClass = {
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    slate: "text-slate-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-2 text-sm font-bold ${toneClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-slate-400">{detail}</p> : null}
    </div>
  );
}

function ProviderLinks({ provider }: { provider: ProviderStatus }) {
  const links = getProviderLinks(provider);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
        >
          {link.label}
          <ExternalLink className="h-3 w-3" />
        </Link>
      ))}
    </div>
  );
}

function getProviderLinks(provider: ProviderStatus) {
  switch (provider.key) {
    case "DAT":
    case "TRUCKSTOP":
      return [
        { label: "Load Board", href: "/loads" },
        { label: "Quote rates", href: "/quote-requests" },
      ];
    case "TWILIO":
    case "RESEND":
      return [{ label: "Communications", href: "/communications" }];
    case "XAI":
      return [{ label: "AI Command Center", href: "/agents" }];
    case "FMCSA":
    case "CARRIEROK":
      return [{ label: "Carriers", href: "/carriers" }];
    case "HERE":
      return [{ label: "Routing in quotes", href: "/quote-requests" }];
    case "EIA":
      return [{ label: "Fuel in loads", href: "/loads" }];
    default:
      return [{ label: "Load Board", href: "/loads" }];
  }
}

function TestHealthForm({ provider }: { provider: ProviderStatus }) {
  return (
    <form action="/api/integrations/test" method="post">
      <input type="hidden" name="provider" value={provider.key || provider.name} />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
        title="Run a provider health check and write the result to integration logs"
      >
        <Zap className="h-3.5 w-3.5" />
        Test health
      </button>
    </form>
  );
}

function RetryProviderForm({
  provider,
  action,
  label,
}: {
  provider: ProviderStatus;
  action: "retry-capacity" | "retry-post";
  label: string;
}) {
  return (
    <form
      action="/api/integrations/test"
      method="post"
      className="rounded-lg border border-slate-100 bg-white p-3"
    >
      <input type="hidden" name="provider" value={provider.key} />
      <input type="hidden" name="action" value={action} />
      <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Load ID
      </label>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          name="loadId"
          placeholder="LD-0001 or load id"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          {label}
        </button>
      </div>
    </form>
  );
}

function RecentProviderLogs({ logs }: { logs: IntegrationLogView[] }) {
  if (!logs.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
        No recent provider activity logged.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Clock3 className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-bold text-slate-900">Recent activity</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {logs.map((log) => (
          <li key={log.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{log.action}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {log.error ? `Error: ${log.error}` : log.message || "No message"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <LogStatusBadge status={log.status} />
              <p className="mt-1 text-xs text-slate-400">{log.created}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LogStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
        status === "SUCCESS"
          ? "bg-emerald-50 text-emerald-700"
          : status === "FAILED"
            ? "bg-red-50 text-red-700"
            : "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
