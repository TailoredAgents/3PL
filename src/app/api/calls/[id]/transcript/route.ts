import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { z } from "zod";

const transcriptSchema = z.object({
  transcriptText: z.string().trim().min(1),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = transcriptSchema.safeParse({
    transcriptText: formValue(formData, "transcriptText"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Add transcript text before saving." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Transcript validated. Connect DATABASE_URL to persist calls.",
    });
  }

  await prisma.brokerageCall.update({
    where: { id },
    data: {
      transcriptText: parsed.data.transcriptText,
      transcriptStatus: "COMPLETED",
      extractionStatus: "NOT_STARTED",
    },
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${id}`);

  return Response.json({ message: "Transcript saved." });
}
