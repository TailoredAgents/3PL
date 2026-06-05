import { revalidatePath } from "next/cache";

import { requireInternalRole } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  CALL_RECORDING_DISCLOSURE_KEY,
  defaultCallRecordingDisclosure,
} from "@/lib/settings";
import { appSettingsSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
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

  revalidatePath("/settings");

  return Response.json({ message: "Settings saved." });
}
