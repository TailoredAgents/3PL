import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { pricingRecommendationCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = pricingRecommendationCreateSchema.safeParse({
    source: formValue(formData, "source") ?? "MANUAL",
    recommendedCarrierCost: formValue(formData, "recommendedCarrierCost"),
    recommendedCustomerRate: formValue(formData, "recommendedCustomerRate"),
    targetMarginPercent: formValue(formData, "targetMarginPercent") ?? "",
    riskLevel: formValue(formData, "riskLevel"),
    validForHours: formValue(formData, "validForHours") ?? "",
    summary: formValue(formData, "summary"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter valid carrier cost and customer rate." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Pricing recommendation validated. Connect DATABASE_URL to persist pricing data.",
    });
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!quote) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const input = parsed.data;
  const projectedGrossProfit =
    input.recommendedCustomerRate - input.recommendedCarrierCost;
  const marginPercent = Number(
    ((projectedGrossProfit / input.recommendedCustomerRate) * 100).toFixed(2),
  );

  await prisma.pricingRecommendation.create({
    data: {
      quoteRequestId: id,
      source: input.source,
      recommendedCarrierCost: input.recommendedCarrierCost,
      recommendedCustomerRate: input.recommendedCustomerRate,
      projectedGrossProfit,
      marginPercent,
      targetMarginPercent:
        typeof input.targetMarginPercent === "number"
          ? input.targetMarginPercent
          : null,
      riskLevel: nullableString(input.riskLevel),
      validForHours:
        typeof input.validForHours === "number" ? input.validForHours : null,
      summary: nullableString(input.summary),
      notes: nullableString(input.notes),
    },
  });

  await prisma.quoteRequest.update({
    where: { id },
    data: { status: "PRICING" },
  });

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Pricing recommendation saved." });
}
