import { getPublicLoadView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicLoadView(token);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Tracking link not found or expired</h1>
        <p className="mt-2 text-slate-600">Please contact the shipper or broker for the latest status.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Shipment Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">Load {data.loadNumber}</p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Lane</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{data.lane}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{data.status}</dd>
            </div>
            {data.pickup && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Pickup</dt>
                <dd className="mt-1 text-slate-700">{data.pickup}</dd>
              </div>
            )}
            {data.delivery && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Delivery</dt>
                <dd className="mt-1 text-slate-700">{data.delivery}</dd>
              </div>
            )}
          </dl>

          {data.events.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-700">Recent updates</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {data.events.map((event, i) => (
                  <li key={i} className="border-l-2 border-emerald-200 pl-3">
                    {event.time}: {event.type} — {event.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">POD status</h2>
            <p className="mt-1 text-sm">
              {data.hasPod ? "POD received" : "POD pending"}
            </p>
            {data.podDownloadHref && (
              <a
                href={data.podDownloadHref}
                target="_blank"
                className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                Download POD →
              </a>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          This is a secure, time-limited public view provided by the broker. For full details, contact your representative.
        </p>
      </div>
    </main>
  );
}
