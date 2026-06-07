import { revalidatePath } from "next/cache";
import { verifyWebhook } from "@clerk/backend/webhooks";

import {
  markClerkUserDeletedFromWebhook,
  syncClerkUserFromWebhook,
} from "@/lib/clerk-sync";

export async function POST(request: Request) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify Clerk webhook.",
      },
      { status: 400 },
    );
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    await syncClerkUserFromWebhook(event.data);
  }

  if (event.type === "user.deleted") {
    await markClerkUserDeletedFromWebhook(event.data);
  }

  revalidatePath("/admin");
  revalidatePath("/settings");

  return Response.json({ received: true, type: event.type });
}
