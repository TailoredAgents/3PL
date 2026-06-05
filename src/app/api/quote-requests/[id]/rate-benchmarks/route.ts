import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { rateBenchmarkCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = rateBenchmarkCreateSchema.safeParse({
    source: formValue(formData, "source") ?? "MANUAL",
    sourceLabel: formValue(formData, "sourceLabel"),
    lowRate: formValue(formData, "lowRate") ?? "",
    highRate: formValue(formData, "highRate") ?? "",
    averageRate: formValue(formData, "averageRate"),
    confidence: formValue(formData, "confidence") ?? "",
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a valid benchmark average rate." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Rate benchmark validated. Connect DATABASE_URL to persist pricing data.",
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
  await prisma.rateBenchmark.create({
    data: {
      quoteRequestId: id,
      source: input.source,
      sourceLabel: nullableString(input.sourceLabel),
      lowRate: typeof input.lowRate === "number" ? input.lowRate : null,
      highRate: typeof input.highRate === "number" ? input.highRate : null,
      averageRate: input.averageRate,
      confidence:
        typeof input.confidence === "number" ? input.confidence : null,
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

  return Response.json({ message: "Rate benchmark saved." });
}
