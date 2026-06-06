import { CarrierCreateForm } from "@/components/crm-forms";
import { CarrierListFilter } from "@/components/carrier-list-filter";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carrierViews = await getCarrierViews();
  const approved = carrierViews.filter(
    (c) => c.complianceStatus === "Approved",
  ).length;
  const totalLoads = carrierViews.reduce((sum, c) => sum + c.loadCount, 0);
  const totalDelivered = carrierViews.reduce(
    (sum, c) => sum + (c.deliveredLoads ?? 0),
    0,
  );

  return (
    <InternalShell
      active="Carriers"
      eyebrow="Carrier desk"
      title="Carrier management"
      description="Build a reliable carrier file before tendering loads: authority, contacts, compliance status, preferred lanes, and performance notes."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Carriers", value: carrierViews.length.toString() },
          { label: "Approved", value: approved.toString() },
          { label: "Loads covered", value: totalLoads.toString() },
          { label: "Delivered", value: totalDelivered.toString() },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Create carrier</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Add carriers before they are assigned to a load. Compliance status
          should be verified before tendering.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <CarrierCreateForm />
        </div>
      </section>

      <CarrierListFilter
        carriers={carrierViews.map((c) => ({
          id: c.id,
          company: c.company,
          mcNumber: c.mcNumber,
          dotNumber: c.dotNumber,
          contact: c.contact,
          phone: c.phone,
          email: c.email,
          complianceStatus: c.complianceStatus,
          preferredLanes: c.preferredLanes,
          notes: c.notes,
          loadCount: c.loadCount,
          deliveredLoads: c.deliveredLoads ?? 0,
          avgMargin: c.avgMargin ?? 0,
        }))}
      />
    </InternalShell>
  );
}
