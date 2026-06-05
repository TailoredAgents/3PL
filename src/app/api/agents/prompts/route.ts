import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl } from "@/lib/prisma";
import { saveAgentPromptTemplate } from "@/lib/settings";
import { agentPromptTemplateSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
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

  await saveAgentPromptTemplate(parsed.data);

  revalidatePath("/agents");

  return Response.json({ message: "Prompt template saved." });
}
