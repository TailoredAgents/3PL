import { revalidatePath } from "next/cache";

import { generateInternalCarrierCandidates } from "@/lib/carrier-sourcing";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { carrierSourcingGenerateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = carrierSourcingGenerateSchema.safeParse({
    source: formValue(formData, "source") ?? "INTERNAL_HISTORY",
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose a valid carrier sourcing source." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier candidate generation validated. Connect DATABASE_URL to persist generated candidates.",
    });
  }

  try {
    const result = await generateInternalCarrierCandidates(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/carriers");
    revalidatePath("/dashboard");

    return Response.json({
      message: `${result.createdCount} carrier candidate${
        result.createdCount === 1 ? "" : "s"
      } generated from internal history.`,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate carrier candidates.",
      },
      { status: 400 },
    );
  }
}
