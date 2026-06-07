import { CommunicationsWorkspace } from "@/components/communications-workspace";
import { InternalShell } from "@/components/internal-shell";
import { getCommunicationWorkspaceView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const workspace = await getCommunicationWorkspaceView();

  return (
    <InternalShell
      active="Communications"
      eyebrow="Sales & CRM"
      title="Communications"
      description="Customer conversations, call/SMS/email actions, and contact context in one workspace."
      action={{ label: "Settings", href: "/settings" }}
    >
      <CommunicationsWorkspace workspace={workspace} />
    </InternalShell>
  );
}
