import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  LifeBuoy,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { customerAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { getCustomerQuoteRequestViews, getShipperDetailView } from "@/lib/crm";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function CustomerPortalPage() {
  const cookieStore = await cookies();
  const shipperId = verifyPortalSessionToken(
    "customer",
    cookieStore.get(customerAuthCookie)?.value,
  );

  if (!shipperId || !hasDatabaseUrl() || !prisma) {
    return <CustomerPortalGate />;
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id: shipperId },
    select: { id: true, companyName: true, portalEnabled: true },
  });

  const myQuotes = shipper?.portalEnabled ? await getCustomerQuoteRequestViews(shipperId) : [];
  const detail = shipper?.portalEnabled ? await getShipperDetailView(shipperId) : null;
  const myLoads = detail?.loads || [];
  const myDocuments = detail?.documents || [];
  const inactiveLoadStatuses = new Set(["Delivered", "Pod Received", "Invoiced", "Paid"]);
  const activeLoads = (myLoads as any[]).filter(
    (load) => !inactiveLoadStatuses.has(load.status),
  );
  const myInvoices = shipper?.portalEnabled ? await prisma.invoice.findMany({
    where: { shipperId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { load: { select: { loadNumber: true } } },
  }) : [];

  if (!shipper?.portalEnabled) {
    return (
      <CustomerPortalGate
        title="Portal access is not enabled"
        description="Your customer record exists, but self-service portal access has not been enabled yet. Contact your broker to turn on portal access for this account."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f8fafc_34%,#e2e8f0_100%)] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-lg border border-white bg-white/90 p-6 shadow-xl shadow-slate-950/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Customer portal
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  Account workspace
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight">
                Welcome, {shipper.companyName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Track active freight, review quotes, update preferred lanes and contacts,
                and access documents from one secure customer workspace.
              </p>
            </div>
            <Link
              href="/customer-login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
            >
              Switch account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <PortalStat label="Quotes" value={myQuotes.length.toString()} />
            <PortalStat label="Active loads" value={activeLoads.length.toString()} />
            <PortalStat label="Documents" value={myDocuments.length.toString()} />
            <PortalStat label="Invoices" value={myInvoices.length.toString()} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <PortalPanel
            icon={ClipboardList}
            title="Quotes & requests"
            description="Review recent quote activity and request a new shipment quote."
          >
            {myQuotes.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {myQuotes.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex justify-between border-b pb-1">
                    <span>{q.originCity} → {q.destinationCity} ({q.equipment || 'N/A'})</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{q.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No quote requests yet.</p>
            )}
            <details className="mt-3">
              <summary className="text-sm font-semibold text-emerald-700 cursor-pointer">Request new quote</summary>
              <form action="/api/portal/quote-requests" method="post" className="mt-2 grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <input name="originCity" placeholder="Origin city" required className="rounded border border-slate-200 p-2 text-xs" />
                  <input name="originState" placeholder="State" required className="rounded border border-slate-200 p-2 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="destinationCity" placeholder="Dest city" required className="rounded border border-slate-200 p-2 text-xs" />
                  <input name="destinationState" placeholder="State" required className="rounded border border-slate-200 p-2 text-xs" />
                </div>
                <select name="equipmentType" className="rounded border border-slate-200 p-2 text-xs">
                  <option>Dry Van</option>
                  <option>Reefer</option>
                  <option>Flatbed</option>
                </select>
                <button type="submit" className="rounded bg-emerald-600 py-2 text-xs font-bold text-white">Submit request</button>
              </form>
            </details>
          </PortalPanel>

          <PortalPanel
            icon={PackageCheck}
            title="Active loads & tracking"
            description="Follow active shipments and open public tracking when available."
          >
            {activeLoads.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {activeLoads.slice(0,3).map((l: any) => (
                  <li key={l.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-900">{l.lane || `${l.originCity} → ${l.destinationCity}`}</div>
                    <div className="mt-1 text-xs text-slate-500">Pickup: {l.pickup || 'TBD'} | Carrier: {l.carrier?.companyName || 'TBD'}</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{l.status}</span>
                      {l.publicTrackingLinks?.length > 0 && <a href={`/track/${l.publicTrackingLinks[0].token}`} className="text-xs font-bold text-emerald-700">Track →</a>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No active loads.</p>
            )}
          </PortalPanel>

          <PortalPanel
            icon={ShieldCheck}
            title="Saved preferences"
            description="Keep preferred lanes and customer contacts current for your brokerage team."
            className="md:col-span-2"
          >
            <div className="mt-3 grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Lanes</p>
                <p className="text-xs text-slate-600 mt-1">{detail?.lanes?.length ? detail.lanes.join('; ') : 'No lanes saved yet.'}</p>
                <form action="/api/portal/preferences" method="post" className="mt-2 grid gap-2">
                  <input type="hidden" name="action" value="lanes" />
                  <label className="grid gap-1 text-xs font-medium text-slate-700">
                    Preferred lanes
                    <input
                      name="lanes"
                      defaultValue={detail?.lanes?.join('; ') || ''}
                      placeholder="Atlanta to Dallas; Savannah to Nashville"
                      className="rounded border border-slate-300 p-2 text-sm font-normal"
                    />
                  </label>
                  <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Save lanes</button>
                </form>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Contacts</p>
                {detail?.contacts?.length ? (
                  <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                    {detail.contacts.slice(0,3).map((c: any) => (
                      <li key={c.id}>• {c.fullName} {c.email ? `(${c.email})` : ''}</li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-600 mt-1">No contacts saved.</p>}
                <form action="/api/portal/preferences" method="post" className="mt-2 grid gap-2">
                  <input type="hidden" name="action" value="contact" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input name="firstName" placeholder="First name" required className="rounded border border-slate-300 p-2 text-xs" />
                    <input name="lastName" placeholder="Last name" className="rounded border border-slate-300 p-2 text-xs" />
                  </div>
                  <input name="email" type="email" placeholder="Email" className="rounded border border-slate-300 p-2 text-xs" />
                  <input name="phone" placeholder="Phone" className="rounded border border-slate-300 p-2 text-xs" />
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" name="isPrimary" value="true" className="rounded" />
                    Primary contact
                  </label>
                  <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Add contact</button>
                </form>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Update your preferred lanes and contacts here. Changes are visible to your broker team.</p>
          </PortalPanel>

          <PortalPanel
            icon={FileText}
            title="Documents & invoices"
            description="Review recent paperwork and invoice status."
          >
            {myDocuments.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {myDocuments.slice(0,4).map((d) => (
                  <li key={(d as any).id} className="text-xs">• {(d as any).type} - {(d as any).fileName} {(d as any).downloadHref ? <a href={(d as any).downloadHref} className="text-emerald-700">download</a> : null}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No recent documents.</p>
            )}
            {myInvoices.length > 0 && (
              <>
                <p className="mt-3 font-semibold text-slate-700 text-sm">Recent Invoices</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {myInvoices.map((inv: any) => (
                    <li key={inv.id}>
                      • INV for load {inv.load?.loadNumber || 'N/A'} - {formatCurrency(inv.amount)} {inv.status}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-2 text-xs text-slate-500">Full details and downloads via your broker or attached documents.</p>
          </PortalPanel>

          <PortalPanel
            icon={LifeBuoy}
            title="Support"
            description="Start a new request or contact your brokerage team."
          >
            <p className="mt-2 text-sm text-slate-600">Contact your account team or use the intake form for new requests.</p>
            <Link href="/intake" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">New request <ArrowRight className="h-4 w-4" /></Link>
          </PortalPanel>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">This is a self-service portal for approved customers. Data is scoped to your account.</p>
      </div>
    </main>
  );
}

function CustomerPortalGate({
  title = "Customer Portal",
  description = "Log in with the email associated with your account to access quotes, active shipments, documents, invoices, and tracking.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f8fafc_36%,#e2e8f0_100%)] px-5 py-8 text-slate-950">
      <section className="w-full max-w-4xl overflow-hidden rounded-lg border border-white bg-white shadow-xl shadow-slate-950/10">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 p-8 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-lg font-black text-slate-950">
              DAO
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Customer workspace
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
          </div>
          <div className="p-8">
            <div className="grid gap-3">
              <PortalGateItem
                icon={ClipboardList}
                title="Quote requests"
                detail="Submit and review shipment quote activity."
              />
              <PortalGateItem
                icon={Truck}
                title="Active freight"
                detail="Track loads and view status updates shared by your broker."
              />
              <PortalGateItem
                icon={FileText}
                title="Documents and invoices"
                detail="Access paperwork tied to your customer account."
              />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/customer-login"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
              >
                Log in to portal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
              >
                Back to public site
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Your broker controls portal access. Public tracking links also work without a portal login when provided.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PortalGateItem({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ClipboardList;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function PortalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function PortalPanel({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: typeof ClipboardList;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : value && typeof value === "object" && "toString" in value
          ? Number(value.toString())
          : 0;

  return `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}
