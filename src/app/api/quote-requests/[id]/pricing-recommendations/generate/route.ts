import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { createSystemPricingRecommendation } from "@/lib/pricing";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Pricing generation validated. Connect DATABASE_URL to persist pricing recommendations.",
    });
  }

  try {
    await createSystemPricingRecommendation(id);

    await prisma.quoteRequest.update({
      where: { id },
      data: { status: "PRICING" },
    });

    revalidatePath("/quote-requests");
    revalidatePath(`/quote-requests/${id}`);
    revalidatePath("/dashboard");

    return Response.json({ message: "System pricing recommendation generated." });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate pricing recommendation.",
      },
      { status: 400 },
    );
  }
}
