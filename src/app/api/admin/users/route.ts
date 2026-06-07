import { revalidatePath } from "next/cache";

import { requireInternalRole } from "@/lib/current-user";
import { upsertInternalUser } from "@/lib/commissions";
import { formValue } from "@/lib/server-utils";
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
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a name, email, and internal role." },
      { status: 400 },
    );
  }

  await upsertInternalUser({
    ...parsed.data,
    currentUser,
  });

  revalidatePath("/admin");

  return Response.json({ message: "Internal user saved." });
}
