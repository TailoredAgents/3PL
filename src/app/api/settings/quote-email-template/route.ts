import { revalidatePath } from "next/cache";

import { requireInternalRole } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { saveQuoteEmailTemplate } from "@/lib/settings";
import { quoteEmailTemplateSettingsSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to update quote email templates.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = quoteEmailTemplateSettingsSchema.safeParse({
    subject: formValue(formData, "subject"),
    body: formValue(formData, "body"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter the quote email subject and body template." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote email template validated. Connect DATABASE_URL to persist templates.",
    });
  }

  await saveQuoteEmailTemplate(parsed.data);

  revalidatePath("/settings");
  revalidatePath("/quote-requests");

  return Response.json({ message: "Quote email template saved." });
}
