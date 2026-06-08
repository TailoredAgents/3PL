import { cookies } from "next/headers";
import Link from "next/link";

import { carrierAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export default async function CarrierPortalPage() {
  const cookieStore = await cookies();
  const carrierId = verifyPortalSessionToken(
    "carrier",
    cookieStore.get(carrierAuthCookie)?.value,
  );

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

  const rateConfirmationLoads = await prisma.load.findMany({
    where: {
      carrierId,
      rateConfirmationStatus: { in: ["DRAFTED", "SENT", "SIGNED"] },
    },
    include: {
      shipper: { select: { companyName: true } },
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, fileName: true },
      },
    },
    orderBy: [{ rateConfirmationSentAt: "desc" }, { updatedAt: "desc" }],
    take: 12,
  });

  // Their recent documents
  const documents = await prisma.document.findMany({
    where: { carrierId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, type: true, fileName: true, createdAt: true },
  });

  // Pending tenders (CarrierQuotes)
  const tenders = await prisma.carrierQuote.findMany({
    where: { carrierId, status: { in: ["REQUESTED", "RECEIVED"] } },
    include: {
      load: {
        select: { id: true, loadNumber: true, originCity: true, destinationCity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Payments (CarrierInvoices for their loads)
  const payments = await prisma.carrierInvoice.findMany({
    where: { carrierId },
    include: {
      load: {
        select: { loadNumber: true, originCity: true, destinationCity: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
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

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Rate Confirmations
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Review the broker-issued rate confirmation, then sign here so
                the broker can move the load forward.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
              {rateConfirmationLoads.length} active
            </span>
          </div>

          {rateConfirmationLoads.length ? (
            <div className="mt-4 grid gap-4">
              {rateConfirmationLoads.map((load) => {
                const document = load.documents[0];
                const signed = load.rateConfirmationStatus === "SIGNED";

                return (
                  <article
                    key={load.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {formatLoadNumber(load.loadNumber)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${rateConfirmationStatusClass(
                              load.rateConfirmationStatus,
                            )}`}
                          >
                            {formatStatus(load.rateConfirmationStatus)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {load.shipper.companyName} • {load.originCity} →{" "}
                          {load.destinationCity}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Carrier rate:{" "}
                          {load.carrierRate
                            ? formatCurrency(Number(load.carrierRate))
                            : "Rate pending"}{" "}
                          • Sent{" "}
                          {load.rateConfirmationSentAt
                            ? formatDateTime(load.rateConfirmationSentAt)
                            : "not yet"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {document
                            ? document.fileName
                            : "The broker still needs to generate the rate confirmation document."}
                        </p>
                      </div>
                      {document ? (
                        <Link
                          href={`/api/loads/${load.id}/rate-confirmation/pdf`}
                          target="_blank"
                          className="w-fit rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Open PDF
                        </Link>
                      ) : null}
                    </div>

                    {signed ? (
                      <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                        Signed{" "}
                        {load.rateConfirmationSignedAt
                          ? formatDateTime(load.rateConfirmationSignedAt)
                          : "and returned to the broker"}.
                      </p>
                    ) : document ? (
                      <form
                        action={`/api/carrier-portal/rate-confirmations/${load.id}/sign`}
                        method="post"
                        className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 font-semibold text-slate-700">
                            Signer name
                            <input
                              name="signerName"
                              required
                              placeholder="Full name"
                              className="rounded border border-slate-200 p-2 font-normal"
                            />
                          </label>
                          <label className="grid gap-1 font-semibold text-slate-700">
                            Title
                            <input
                              name="signerTitle"
                              required
                              placeholder="Dispatcher, owner, etc."
                              className="rounded border border-slate-200 p-2 font-normal"
                            />
                          </label>
                        </div>
                        <label className="flex gap-2 rounded-md bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
                          <input
                            type="checkbox"
                            name="signatureConsent"
                            value="on"
                            required
                            className="mt-1"
                          />
                          I confirm I am authorized to sign for this carrier
                          and accept the rate confirmation terms for this load.
                        </label>
                        <button
                          type="submit"
                          className="w-fit rounded bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                        >
                          Sign rate confirmation
                        </button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-white px-4 py-3 text-sm text-slate-600">
              No rate confirmations are waiting for your carrier account.
            </p>
          )}
        </section>

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

          {/* Your Tenders */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Your Tenders / Quotes</h2>
            {tenders.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {tenders.map((t) => (
                  <li key={t.id} className="border-b pb-2">
                    <div>
                      Load {t.load.loadNumber} • {t.load.originCity} → {t.load.destinationCity}
                    </div>
                    <div className="text-xs text-slate-500">
                      Your rate: ${Number(t.quotedRate).toLocaleString()}
                    </div>
                    <div className="mt-1 flex gap-2">
                      <form action={`/api/carrier-portal/tenders/${t.id}/accept`} method="post">
                        <button type="submit" className="text-xs font-semibold text-emerald-700 hover:underline">Accept</button>
                      </form>
                      <form action={`/api/carrier-portal/tenders/${t.id}/decline`} method="post">
                        <button type="submit" className="text-xs font-semibold text-red-700 hover:underline">Decline</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No pending tenders.</p>
            )}
          </div>

          {/* Send Check-Call / Update */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Send Check-Call / Tracking Update</h2>
            {loads.length > 0 ? (
              <div className="mt-2">
                <form action="/api/carrier-portal/check-call" method="post" className="grid gap-3 text-sm">
                  <select name="loadId" required className="rounded border p-2">
                    {loads.map((load) => (
                      <option key={load.id} value={load.id}>
                        {load.loadNumber} - {load.originCity} → {load.destinationCity}
                      </option>
                    ))}
                  </select>
                  <select name="type" className="rounded border p-2">
                    <option value="LOCATION_UPDATE">Location update</option>
                    <option value="PICKUP_CONFIRMED">Pickup confirmed</option>
                    <option value="DELAY">Delay</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="POD_UPLOADED">POD uploaded</option>
                  </select>
                  <input name="location" placeholder="Current city/state" className="rounded border p-2" />
                  <textarea name="message" required placeholder="Update details" className="min-h-24 rounded border p-2" />
                  <input name="occurredAt" type="datetime-local" className="rounded border p-2" />
                  <button type="submit" className="rounded bg-emerald-600 py-2 font-semibold text-white">Send update</button>
                </form>
                <p className="mt-1 text-[10px] text-slate-500">Updates appear in load history and tracking.</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No loads to update yet.</p>
            )}
          </div>

          {/* My Payments */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">My Payments</h2>
            {payments.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="border-b pb-1">
                    Load {p.load?.loadNumber || 'N/A'} • ${Number(p.amount).toLocaleString()} • {p.status}
                    {p.paidAt ? ` (Paid ${new Date(p.paidAt).toLocaleDateString()})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No payments yet.</p>
            )}
            <p className="mt-2 text-xs text-slate-500">View full status and remittance via your broker.</p>
          </div>

          {/* Recent Documents */}
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">Your Recent Documents</h2>
            {documents.length ? (
              <ul className="mt-3 space-y-1 text-sm">
                {documents.map((d) => (
                  <li key={d.id}>• {d.type} - {d.fileName} ({new Date(d.createdAt).toLocaleDateString()})</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No documents on file yet. Upload above.</p>
            )}
            <p className="mt-2 text-xs text-slate-500">Appear in Document Center.</p>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">Carrier portal for approved partners. Data scoped to your carrier record.</p>
      </div>
    </main>
  );
}

function formatLoadNumber(loadNumber: number | null) {
  return `LD-${String(loadNumber ?? "").padStart(4, "0")}`;
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function rateConfirmationStatusClass(status: string) {
  if (status === "SIGNED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "SENT") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-amber-100 text-amber-800";
}
