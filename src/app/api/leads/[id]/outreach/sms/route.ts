import { revalidatePath } from "next/cache";

import { sendLeadSms } from "@/lib/outreach";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { outboundSmsCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = outboundSmsCreateSchema.safeParse({
    toPhone: formValue(formData, "toPhone"),
    message: formValue(formData, "message"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a phone number and message before sending SMS." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "SMS outreach validated. Connect DATABASE_URL to persist outreach activity.",
    });
  }

  try {
    const result = await sendLeadSms({
      leadId: id,
      toPhone: parsed.data.toPhone,
      message: parsed.data.message,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/communications");
    revalidatePath("/dashboard");

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send SMS.",
      },
      { status: 400 },
    );
  }
}
