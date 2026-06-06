import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { ShipperEditForm } from "@/components/crm-forms";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShipperEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasDatabaseUrl() || !prisma) {
    notFound();
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id },
  });

  if (!shipper) {
    notFound();
  }

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Shipper account"
      title={`Edit ${shipper.companyName}`}
      description="Update company name, industry, website, status, and account notes."
      action={{ label: "Back to account", href: `/shippers/${id}` }}
    >
      <Link
        href={`/shippers/${id}`}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shipper account
      </Link>

      <article className="max-w-2xl overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">Shipper details</p>
        </div>
        <div className="p-5">
          <p className="mb-4 text-xs leading-5 text-slate-500">
            Lane context lives in the notes field using the format:{" "}
            <code className="rounded bg-slate-100 px-1">Lanes: Atlanta to Dallas; Savannah to Nashville</code>
          </p>
          <ShipperEditForm
            shipperId={id}
            defaults={{
              companyName: shipper.companyName,
              industry: shipper.industry ?? "",
              website: shipper.website ?? "",
              status: shipper.status,
              notes: shipper.notes ?? "",
            }}
          />
        </div>
      </article>
    </InternalShell>
  );
}
