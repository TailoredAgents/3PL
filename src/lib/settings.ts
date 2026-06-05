import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const CALL_RECORDING_DISCLOSURE_KEY = "callRecordingDisclosure";

export const defaultCallRecordingDisclosure =
  "This call may be recorded and transcribed to help our team capture shipment details, improve service, and follow up accurately. By continuing, you consent to this recording.";

export type AppSettingsView = {
  callRecordingDisclosure: string;
};

export async function getAppSettings(): Promise<AppSettingsView> {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      callRecordingDisclosure: defaultCallRecordingDisclosure,
    };
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: CALL_RECORDING_DISCLOSURE_KEY },
    });

    return {
      callRecordingDisclosure:
        setting?.value ?? defaultCallRecordingDisclosure,
    };
  } catch {
    return {
      callRecordingDisclosure: defaultCallRecordingDisclosure,
    };
  }
}
