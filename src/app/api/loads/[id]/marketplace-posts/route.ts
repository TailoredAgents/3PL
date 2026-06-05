import { revalidatePath } from "next/cache";

import { postLoadToMarketplaces } from "@/lib/marketplace/marketplace-workflow";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Marketplace load post validated. Connect DATABASE_URL to persist provider post logs.",
    });
  }

  try {
    const result = await postLoadToMarketplaces(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/dashboard");

    if (!result.postedCount) {
      return Response.json(
        {
          error:
            "Load was not posted to DAT/Truckstop. Check provider endpoint configuration.",
          providerStatus: result.providerStatus,
        },
        { status: 400 },
      );
    }

    return Response.json({
      message: `Load posted to ${result.postedCount} marketplace provider${
        result.postedCount === 1 ? "" : "s"
      }.`,
      providerStatus: result.providerStatus,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to post load to marketplaces.",
      },
      { status: 400 },
    );
  }
}
