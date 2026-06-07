import { revalidatePath } from "next/cache";

import { requireInternalRole } from "@/lib/current-user";
import { upsertInternalUser } from "@/lib/commissions";
import { checkboxValue, formValue } from "@/lib/server-utils";
import { internalUserUpsertSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let currentUser: Awaited<ReturnType<typeof requireInternalRole>>;

  try {
    currentUser = await requireInternalRole(["OWNER", "ADMIN"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to manage users.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = internalUserUpsertSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    role: formValue(formData, "role"),
    phone: formValue(formData, "phone"),
    sendInvite: checkboxValue(formData, "sendInvite"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a name, email, and internal role." },
      { status: 400 },
    );
  }

  let result: Awaited<ReturnType<typeof upsertInternalUser>>;

  try {
    result = await upsertInternalUser({
      ...parsed.data,
      currentUser,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save internal user.",
      },
      { status: 400 },
    );
  }

  revalidatePath("/admin");

  return Response.json({
    message: parsed.data.sendInvite
      ? `Internal user saved. ${result?.inviteMessage ?? ""}`.trim()
      : "Internal user saved.",
  });
}
