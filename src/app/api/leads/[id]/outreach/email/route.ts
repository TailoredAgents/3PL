import { revalidatePath } from "next/cache";

import { getCurrentInternalUser } from "@/lib/current-user";
import { sendLeadEmail } from "@/lib/outreach";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { quoteEmailSendSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = quoteEmailSendSchema.safeParse({
    toEmail: formValue(formData, "toEmail"),
    subject: formValue(formData, "subject"),
    body: formValue(formData, "body"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a recipient, subject, and email body." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Email outreach validated. Connect DATABASE_URL to persist outreach activity.",
    });
  }

  try {
    const currentUser = await getCurrentInternalUser();
    const result = await sendLeadEmail({
      leadId: id,
      toEmail: parsed.data.toEmail,
      subject: parsed.data.subject,
      body: parsed.data.body,
      userId: currentUser?.id,
    });

    revalidatePath("/communications");
    revalidatePath("/email");
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send email.",
      },
      { status: 400 },
    );
  }
}
