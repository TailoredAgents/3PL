import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { generateRateConfirmationDocument } from "@/lib/rate-confirmation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Rate confirmation draft validated. Connect DATABASE_URL to persist generated documents.",
    });
  }

  try {
    const document = await generateRateConfirmationDocument(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/dashboard");

    return Response.json({
      message: "Rate confirmation drafted.",
      fileUrl: document.fileUrl,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to draft rate confirmation.",
      },
      { status: 400 },
    );
  }
}
