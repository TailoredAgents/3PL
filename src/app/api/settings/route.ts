import { revalidatePath } from "next/cache";

import { requireInternalRole } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  CALL_RECORDING_DISCLOSURE_KEY,
  defaultCallRecordingDisclosure,
} from "@/lib/settings";
import { appSettingsSchema } from "@/lib/validation";

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
            : "You do not have permission to update settings.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = appSettingsSchema.safeParse({
    callRecordingDisclosure:
      formValue(formData, "callRecordingDisclosure") ??
      defaultCallRecordingDisclosure,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter the call recording disclosure message." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Settings validated. Connect DATABASE_URL to persist settings.",
    });
  }

  const existing = await prisma.appSetting.findUnique({
    where: { key: CALL_RECORDING_DISCLOSURE_KEY },
  });

  await prisma.appSetting.upsert({
    where: { key: CALL_RECORDING_DISCLOSURE_KEY },
    create: {
      key: CALL_RECORDING_DISCLOSURE_KEY,
      value: parsed.data.callRecordingDisclosure,
    },
    update: {
      value: parsed.data.callRecordingDisclosure,
    },
  });

  await logAudit({
    action: "SETTINGS_UPDATED",
    entityType: "AppSetting",
    entityId: CALL_RECORDING_DISCLOSURE_KEY,
    summary: "Call recording disclosure updated.",
    user: currentUser,
    beforeJson: existing ? { value: existing.value } : null,
    afterJson: { value: parsed.data.callRecordingDisclosure },
  });

  revalidatePath("/settings");
  revalidatePath("/admin");

  return Response.json({ message: "Settings saved." });
}
