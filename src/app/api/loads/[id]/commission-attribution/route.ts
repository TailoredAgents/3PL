import { requireInternalRole } from "@/lib/current-user";
import { updateLoadCommissionAttribution } from "@/lib/commissions";
import { checkboxValue, formValue } from "@/lib/server-utils";
import { loadCommissionAttributionSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let currentUser: Awaited<ReturnType<typeof requireInternalRole>>;

  try {
    currentUser = await requireInternalRole(["OWNER", "ADMIN", "OPS"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to update load attribution.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = loadCommissionAttributionSchema.safeParse({
    managingUserId: formValue(formData, "managingUserId"),
    customerOwnerUserId: formValue(formData, "customerOwnerUserId"),
    applyToClient: checkboxValue(formData, "applyToClient"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose valid commission attribution users." },
      { status: 400 },
    );
  }

  try {
    await updateLoadCommissionAttribution({
      loadId: id,
      managingUserId: parsed.data.managingUserId || null,
      customerOwnerUserId: parsed.data.customerOwnerUserId || null,
      applyToClient: parsed.data.applyToClient,
      currentUser,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update commission attribution.",
      },
      { status: 400 },
    );
  }

  return Response.json({ message: "Commission attribution saved." });
}
