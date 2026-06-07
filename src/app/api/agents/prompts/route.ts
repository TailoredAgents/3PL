import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";
import { requireInternalRole } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl } from "@/lib/prisma";
import { saveAgentPromptTemplate } from "@/lib/settings";
import { agentPromptTemplateSchema } from "@/lib/validation";

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
            : "You do not have permission to update prompts.",
      },
      { status: 403 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Submit prompt template fields as form data." },
      { status: 400 },
    );
  }

  const parsed = agentPromptTemplateSchema.safeParse({
    agentName: formValue(formData, "agentName"),
    systemPrompt: formValue(formData, "systemPrompt"),
    task: formValue(formData, "task"),
    placeholderNextAction: formValue(formData, "placeholderNextAction"),
    changeReason: formValue(formData, "changeReason"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter the agent, system prompt, task, and fallback action." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl()) {
    return Response.json({
      message:
        "Prompt template validated. Connect DATABASE_URL to persist templates.",
    });
  }

  await saveAgentPromptTemplate(parsed.data, {
    changedByUserId: currentUser?.id ?? null,
    changeReason: parsed.data.changeReason,
  });
  await logAudit({
    action: "AGENT_PROMPT_UPDATED",
    entityType: "AgentPromptTemplate",
    entityId: parsed.data.agentName,
    summary: `${parsed.data.agentName} prompt template updated.`,
    user: currentUser,
    afterJson: {
      agentName: parsed.data.agentName,
      changeReason: parsed.data.changeReason || null,
    },
  });

  revalidatePath("/agents");
  revalidatePath("/admin");

  return Response.json({ message: "Prompt template saved." });
}
