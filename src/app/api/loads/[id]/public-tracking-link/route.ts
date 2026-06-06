import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { generatePublicTrackingLink } from "@/lib/crm";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Public tracking link generation validated (no DB)." });
  }

  try {
    const result = await generatePublicTrackingLink(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/tracking");
    revalidatePath("/dashboard");

    return Response.json({
      message: "Public tracking link generated.",
      url: result.url,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate tracking link.",
      },
      { status: 400 },
    );
  }
}
