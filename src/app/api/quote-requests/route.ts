import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  createInternalQuoteRequest,
  parseInternalQuoteFormData,
} from "@/lib/quote-workflow";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = parseInternalQuoteFormData(formData);

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required quote fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote request validated. Connect DATABASE_URL to persist CRM records.",
    });
  }

  const input = parsed.data;
  await createInternalQuoteRequest(input);

  revalidatePath("/quote-requests");
  revalidatePath("/leads");
  revalidatePath("/shippers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Quote request created." });
}
