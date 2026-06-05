import { revalidatePath } from "next/cache";

import { requestCarrierCandidateQuote } from "@/lib/carrier-sourcing";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { carrierCandidateRequestQuoteSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; candidateId: string }> },
) {
  const { id, candidateId } = await context.params;
  const formData = await request.formData();
  const parsed = carrierCandidateRequestQuoteSchema.safeParse({
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter valid request notes." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier quote request validated. Connect DATABASE_URL to persist sourcing status.",
    });
  }

  try {
    await requestCarrierCandidateQuote(id, candidateId, parsed.data.notes);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/carriers");
    revalidatePath("/dashboard");

    return Response.json({ message: "Carrier quote requested." });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to request carrier quote.",
      },
      { status: 400 },
    );
  }
}
