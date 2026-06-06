import { revalidatePath } from "next/cache";

import { startLeadClickToCall } from "@/lib/outreach";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { outboundCallCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = outboundCallCreateSchema.safeParse({
    toPhone: formValue(formData, "toPhone"),
    note: formValue(formData, "note"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a phone number before starting the call." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Click-to-call validated. Connect DATABASE_URL to persist outreach activity.",
    });
  }

  try {
    const result = await startLeadClickToCall({
      leadId: id,
      toPhone: parsed.data.toPhone,
      note: parsed.data.note,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/calls");
    revalidatePath("/communications");
    revalidatePath("/dashboard");

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start outbound call.",
      },
      { status: 400 },
    );
  }
}
