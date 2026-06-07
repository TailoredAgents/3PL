import { cookies } from "next/headers";
import Link from "next/link";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const CUSTOMER_COOKIE = "atlanta_freight_customer";

export default async function CustomerPortalPage() {
  const cookieStore = await cookies();
  const shipperId = cookieStore.get(CUSTOMER_COOKIE)?.value;

  if (!shipperId || !hasDatabaseUrl() || !prisma) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">Customer Portal</h1>
          <p className="mt-2 text-slate-600">Please <Link href="/customer-login" className="underline">log in</Link> with the email associated with your account.</p>
          <p className="mt-4 text-sm text-slate-500">Your broker controls portal access. Public tracking links are also available if provided.</p>
        </div>
      </main>
    );
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id: shipperId },
    select: { id: true, companyName: true, portalEnabled: true },
  });

  if (!shipper?.portalEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">Access not enabled</h1>
          <p className="mt-2">Portal access has not been enabled for your account. Please contact your broker.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {shipper.companyName}</h1>
            <p className="text-sm text-slate-500">Customer self-service portal</p>
          </div>
          <Link href="/customer-login" className="text-sm underline">Switch account</Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Your Quotes &amp; Requests</h2>
            <p className="mt-2 text-sm text-slate-600">View and approve pending quotes. (Full view coming in next update)</p>
            <Link href="/quote-requests" className="mt-4 inline-block text-sm font-semibold text-emerald-700">Go to quotes →</Link>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Active Loads &amp; Tracking</h2>
            <p className="mt-2 text-sm text-slate-600">Track shipments, view PODs and documents.</p>
            <Link href="/tracking" className="mt-4 inline-block text-sm font-semibold text-emerald-700">Open tracking workspace →</Link>
            <p className="mt-1 text-xs text-slate-500">Use public tracking links provided by your team for detailed views.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Documents &amp; Invoices</h2>
            <p className="mt-2 text-sm text-slate-600">Access your BOLs, PODs, rate confirmations, and invoices.</p>
            <Link href="/documents" className="mt-4 inline-block text-sm font-semibold text-emerald-700">View documents →</Link>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Support</h2>
            <p className="mt-2 text-sm text-slate-600">Contact your account team or use the intake form for new requests.</p>
            <Link href="/intake" className="mt-4 inline-block text-sm font-semibold text-emerald-700">New request →</Link>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">This is a self-service portal for approved customers. Data is scoped to your account.</p>
      </div>
    </main>
  );
}
