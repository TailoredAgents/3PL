import { revalidatePath } from "next/cache";

import { brokerageAgentNames, type BrokerageAgentName } from "@/lib/agent-config";
import { saveAgentMode, type AgentMode } from "@/lib/settings";
import { formValue } from "@/lib/server-utils";

export async function PATCH(request: Request) {
  const formData = await request.formData();
  const agentName = formValue(formData, "agentName");
  const mode = formValue(formData, "mode");

  if (!brokerageAgentNames.includes(agentName as BrokerageAgentName)) {
    return Response.json({ error: "Unknown agent." }, { status: 400 });
  }

  if (mode !== "approve_first" && mode !== "autonomous") {
    return Response.json({ error: "Invalid mode." }, { status: 400 });
  }

  await saveAgentMode(agentName as BrokerageAgentName, mode as AgentMode);
  revalidatePath("/settings");

  return Response.json({
    message: `${agentName} set to ${mode === "autonomous" ? "autonomous" : "approve first"}.`,
  });
}
