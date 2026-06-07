import { revalidatePath } from "next/cache";

import { brokerageAgentNames, type BrokerageAgentName } from "@/lib/agent-config";
import { logAudit } from "@/lib/audit";
import { requireInternalRole } from "@/lib/current-user";
import {
  getAgentModes,
  isAlwaysAutonomousAgent,
  saveAgentMode,
  type AgentMode,
} from "@/lib/settings";
import { formValue } from "@/lib/server-utils";

export async function PATCH(request: Request) {
  let currentUser: Awaited<ReturnType<typeof requireInternalRole>>;

  try {
    currentUser = await requireInternalRole(["OWNER", "ADMIN"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to update agent modes.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const agentName = formValue(formData, "agentName");
  const mode = formValue(formData, "mode");

  if (!brokerageAgentNames.includes(agentName as BrokerageAgentName)) {
    return Response.json({ error: "Unknown agent." }, { status: 400 });
  }

  if (mode !== "approve_first" && mode !== "autonomous") {
    return Response.json({ error: "Invalid mode." }, { status: 400 });
  }

  if (
    isAlwaysAutonomousAgent(agentName as BrokerageAgentName) &&
    mode !== "autonomous"
  ) {
    return Response.json(
      { error: `${agentName} always runs autonomously.` },
      { status: 400 },
    );
  }

  const existingModes = await getAgentModes();
  await saveAgentMode(agentName as BrokerageAgentName, mode as AgentMode);
  await logAudit({
    action: "AGENT_MODE_UPDATED",
    entityType: "AiAgentSetting",
    entityId: agentName,
    summary: `${agentName} mode changed to ${mode}.`,
    user: currentUser,
    beforeJson: { mode: existingModes[agentName as BrokerageAgentName] },
    afterJson: { mode },
  });
  revalidatePath("/settings");
  revalidatePath("/admin");

  return Response.json({
    message: `${agentName} set to ${mode === "autonomous" ? "autonomous" : "approve first"}.`,
  });
}
