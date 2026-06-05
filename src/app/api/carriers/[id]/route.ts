import { revalidatePath } from "next/cache";

import { formValue, nullableString, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { carrierComplianceUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/carriers/[id]">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = carrierComplianceUpdateSchema.safeParse({
    complianceStatus: formValue(formData, "complianceStatus") ?? "PENDING",
    authorityStatus: formValue(formData, "authorityStatus"),
    insuranceStatus: formValue(formData, "insuranceStatus"),
    safetyRating: formValue(formData, "safetyRating"),
    fraudRiskLevel: formValue(formData, "fraudRiskLevel"),
    lastVettedAt: formValue(formData, "lastVettedAt"),
    approvedBy: formValue(formData, "approvedBy"),
    complianceNotes: formValue(formData, "complianceNotes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the carrier compliance update." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier compliance update validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const input = parsed.data;
  const carrier = await prisma.carrier.update({
    where: { id },
    data: {
      complianceStatus: input.complianceStatus,
      authorityStatus: nullableString(input.authorityStatus),
      insuranceStatus: nullableString(input.insuranceStatus),
      safetyRating: nullableString(input.safetyRating),
      fraudRiskLevel: nullableString(input.fraudRiskLevel),
      lastVettedAt: optionalDate(input.lastVettedAt),
      approvedBy: nullableString(input.approvedBy),
      complianceNotes: nullableString(input.complianceNotes),
    },
  });

  revalidatePath("/carriers");
  revalidatePath(`/carriers/${carrier.id}`);
  revalidatePath("/loads");
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier compliance updated." });
}
