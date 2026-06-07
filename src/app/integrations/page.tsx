import Link from "next/link";
import { Plug, RefreshCw } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getIntegrationsOverview } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { providers, totalLogs, failureRate, recentGlobalLogs } = await getIntegrationsOverview();

  return (
    <InternalShell
      active="Integrations"
      eyebrow="Admin"
      title="Integrations"
      description="Monitor external provider connectivity, credentials, last success/failure, and logs. Use Test health buttons to run safe pings (xAI + others). xAI agent/document calls now write logs automatically."
      action={{ label: "Settings", href: "/settings" }}
    >
      {/* Overview metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Plug className="h-4 w-4" /> Providers
          </div>
          <p className="mt-2 text-3xl font-bold">{providers.length}</p>
          <p className="text-xs text-slate-500">Configured: {providers.filter((p) => p.configured).length}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <RefreshCw className="h-4 w-4" /> Recent logs
          </div>
          <p className="mt-2 text-3xl font-bold">{totalLogs}</p>
          <p className="text-xs text-slate-500">Failure rate: {failureRate}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm col-span-2">
          <p className="text-sm font-semibold text-amber-800">Health summary</p>
          <p className="mt-1 text-xs text-amber-700">Review per-provider last success/failure below. Use test actions or provider dashboards for deeper checks. Webhook secrets (Twilio/Resend) enable inbound events.</p>
        </div>
      </section>

      {/* Provider panels */}
      <section className="grid gap-6 xl:grid-cols-2">
        {providers.map((provider) => (
          <article key={provider.name} className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">{provider.name}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${provider.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {provider.configured ? "Configured" : "Missing key"}
              </span>
            </div>
            <div className="p-5 text-sm">
              <p className="text-xs text-slate-500 mb-3">{provider.description}</p>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <p className="font-semibold text-emerald-700">Last success</p>
                  <p>{provider.lastSuccess ?? "Never"}</p>
                </div>
                <div>
                  <p className="font-semibold text-red-700">Last failure</p>
                  <p>{provider.lastFailure ?? "None"}</p>
                </div>
              </div>

              {provider.recentLogs.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">Recent activity</p>
                  <ul className="space-y-1 text-xs">
                    {provider.recentLogs.map((log) => (
                      <li key={log.id} className="flex justify-between border-b pb-0.5">
                        <span>{log.action} • {log.status}</span>
                        <span className="text-slate-400">{log.created}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Link href="/loads" className="text-xs font-semibold text-emerald-700 hover:underline">View in loads</Link>
                {provider.key === "DAT" || provider.key === "TRUCKSTOP" ? (
                  <Link href="/quote-requests" className="text-xs font-semibold text-emerald-700 hover:underline">Test rates</Link>
                ) : null}
                <form action="/api/integrations/test" method="post" className="inline">
                  <input type="hidden" name="provider" value={provider.key || provider.name} />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                    title={'Run a minimal health check / ping for this provider (result logged)'}
                  >
                    Test health
                  </button>
                </form>
                <span className="text-xs text-slate-400">(Test via flows or the button above)</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Recent cross-provider activity */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Recent cross-provider activity (latest {recentGlobalLogs.length})</p>
          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Source: IntegrationLog</span>
        </div>
        {recentGlobalLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No integration logs yet. Activity will appear here when marketplace searches, load posts (DAT/Truckstop), or other provider calls run and create log entries.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Provider</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Message / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGlobalLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{log.created}</td>
                    <td className="px-4 py-2 font-medium text-slate-700">{log.provider}</td>
                    <td className="px-4 py-2 text-slate-600">{log.action}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : log.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 max-w-[420px] truncate" title={log.error || log.message}>
                      {log.error ? <span className="text-red-600">Error: {log.error}</span> : log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Global logs note */}
      <aside className="mt-6 rounded-lg border border-slate-100 bg-white p-5 text-sm text-slate-600">
        <p className="font-semibold">Integration logs</p>
        <p className="mt-1">DAT and TRUCKSTOP marketplace activity writes here via the marketplace workflow. xAI (Grok) agent and document extraction calls are now logged automatically. Use the Test health button on cards to trigger a logged HEALTH_CHECK for supported providers. Per-load logs also appear on individual load pages.</p>
        <p className="mt-2 text-xs">Webhook endpoints (Twilio voice/SMS, Resend) are active at /api/twilio/... and /api/resend/... when secrets configured. More providers will log inbound events in later sub-phases.</p>
      </aside>
    </InternalShell>
  );
}
