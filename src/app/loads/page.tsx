import { InternalShell } from "@/components/internal-shell";
import { LoadBoard } from "@/components/load-board";
import { getLoadViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function LoadsPage() {
  const loadViews = await getLoadViews();

  return (
    <InternalShell
      active="Loads"
      eyebrow="TMS"
      title="Load board"
      description="A broker-facing board for scanning load status, carrier coverage, DAT/Truckstop posting, margin, tracking, POD, billing readiness, and exceptions."
      action={{ label: "Carrier desk", href: "/carriers" }}
    >
      <LoadBoard loads={loadViews} />
    </InternalShell>
  );
}
