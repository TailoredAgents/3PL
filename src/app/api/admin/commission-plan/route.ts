import { requireInternalRole } from "@/lib/current-user";
import { saveCommissionPlan } from "@/lib/commissions";
import { formValue } from "@/lib/server-utils";
import { commissionPlanUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  let currentUser: Awaited<ReturnType<typeof requireInternalRole>>;

  try {
    currentUser = await requireInternalRole(["OWNER", "ADMIN"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to update commissions.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = commissionPlanUpdateSchema.safeParse({
    managingUserPercent: formValue(formData, "managingUserPercent"),
    customerOwnerPercent: formValue(formData, "customerOwnerPercent"),
    houseOwnerPercent: formValue(formData, "houseOwnerPercent"),
    companyPercent: formValue(formData, "companyPercent"),
    houseOwnerUserId: formValue(formData, "houseOwnerUserId"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter valid commission percentages." },
      { status: 400 },
    );
  }

  try {
    await saveCommissionPlan({
      ...parsed.data,
      houseOwnerUserId: parsed.data.houseOwnerUserId || null,
      notes: parsed.data.notes || null,
      currentUser,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update commission plan.",
      },
      { status: 400 },
    );
  }

  return Response.json({ message: "Commission plan saved." });
}
