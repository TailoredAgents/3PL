import { cookies } from "next/headers";
import Link from "next/link";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const CARRIER_COOKIE = "atlanta_freight_carrier";

export default async function CarrierPortalPage() {
  const cookieStore = await cookies();
  const carrierId = cookieStore.get(CARRIER_COOKIE)?.value;

  if (!carrierId || !hasDatabaseUrl() || !prisma) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">Carrier Portal</h1>
          <p className="mt-2 text-slate-600">Please <Link href="/carrier-login" className="underline">log in</Link> with your dispatch email.</p>
          <p className="mt-4 text-sm text-slate-500">Your broker controls carrier portal access. Use this to submit documents and updates.</p>
        </div>
      </main>
    );
  }

  const carrier = await prisma.carrier.findUnique({
    where: { id: carrierId },
    select: { id: true, companyName: true, complianceStatus: true },
  });

  if (!carrier) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">Carrier not found</h1>
          <p className="mt-2">Please contact your broker.</p>
        </div>
      </main>
    );
  }

  // Get some of their loads for context and document linking
  const loads = await prisma.load.findMany({
    where: { carrierId },
    select: { id: true, loadNumber: true, status: true, originCity: true, destinationCity: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  // Their recent documents
  const documents = await prisma.document.findMany({
    where: { carrierId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, type: true, fileName: true, createdAt: true },
  });

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {carrier.companyName}</h1>
            <p className="text-sm text-slate-500">Carrier self-service portal • Compliance: {carrier.complianceStatus}</p>
          </div>
          <Link href="/carrier-login" className="text-sm underline">Switch account</Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Document Submission */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Submit Documents</h2>
            <p className="mt-1 text-sm text-slate-600">Upload POD, BOL, invoices, W-9, COI, or agreements. These flow directly to the Document Center linked to your carrier and load.</p>

            <form action="/api/carrier-portal/documents" method="post" encType="multipart/form-data" className="mt-4 grid gap-3 text-sm">
              <select name="type" required className="border p-2 rounded">
                <option value="POD">Proof of Delivery (POD)</option>
                <option value="BOL">Bill of Lading (BOL)</option>
                <option value="INVOICE">Invoice</option>
                <option value="W9">W-9</option>
                <option value="CERTIFICATE_OF_INSURANCE">Certificate of Insurance</option>
                <option value="BROKER_CARRIER_AGREEMENT">Broker-Carrier Agreement</option>
                <option value="OTHER">Other</option>
              </select>

              <select name="loadId" className="border p-2 rounded">
                <option value="">General (no specific load)</option>
                {loads.map((l) => (
                  <option key={l.id} value={l.id}>{l.loadNumber} - {l.originCity} → {l.destinationCity} ({l.status})</option>
                ))}
              </select>

              <input type="file" name="file" required className="border p-2 rounded" />

              <button type="submit" className="bg-emerald-600 text-white py-2 rounded font-semibold">Upload Document</button>
            </form>
          </div>

          {/* Your Loads / Tenders */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Your Recent Loads</h2>
            {loads.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {loads.map((l) => (
                  <li key={l.id} className="border-b pb-1">
                    {l.loadNumber} • {l.originCity} → {l.destinationCity} • {l.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No loads yet.</p>
            )}
            <p className="mt-3 text-xs text-slate-500">Accept/decline tenders and send check-calls coming in future updates. Contact broker for now.</p>
          </div>

          {/* Recent Documents */}
          <div className="rounded-lg border p-6 md:col-span-2">
            <h2 className="font-semibold">Your Recent Documents (submitted via portal or broker)</h2>
            {documents.length ? (
              <ul className="mt-3 space-y-1 text-sm">
                {documents.map((d) => (
                  <li key={d.id}>• {d.type} - {d.fileName} ({new Date(d.createdAt).toLocaleDateString()})</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No documents on file yet. Upload above to get started.</p>
            )}
            <p className="mt-2 text-xs text-slate-500">All uploads appear in the central Document Center for your broker.</p>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">Carrier portal for approved partners. Data scoped to your carrier record.</p>
      </div>
    </main>
  );
}
