import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { isStorageConfigured } from "@/lib/storage";

export async function GET() {
  const database = await checkDatabase();

  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database,
    integrations: {
      grok: Boolean(process.env.XAI_API_KEY),
      twilio: Boolean(
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN,
      ),
      twilioForwarding: Boolean(process.env.TWILIO_FORWARD_TO_PHONE_NUMBER),
      dat: Boolean(process.env.DAT_CLIENT_ID && process.env.DAT_CLIENT_SECRET),
      truckstop: Boolean(
        process.env.TRUCKSTOP_CLIENT_ID && process.env.TRUCKSTOP_CLIENT_SECRET,
      ),
      clerk: Boolean(
        process.env.CLERK_SECRET_KEY &&
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      ),
      resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      resendWebhook: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      storage: isStorageConfigured(),
    },
  });
}

async function checkDatabase() {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      configured: false,
      reachable: false,
      message: "DATABASE_URL is not configured.",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      configured: true,
      reachable: true,
      message: "Database connection is healthy.",
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      message:
        error instanceof Error
          ? error.message
          : "Database connection failed.",
    };
  }
}
