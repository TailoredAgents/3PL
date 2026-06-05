import { revalidatePath } from "next/cache";

import { searchAndStoreMarketplaceCapacity } from "@/lib/marketplace/marketplace-workflow";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Marketplace capacity search validated. Connect DATABASE_URL to persist capacity candidates.",
    });
  }

  try {
    const result = await searchAndStoreMarketplaceCapacity(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/carriers");
    revalidatePath("/dashboard");

    if (!result.savedCount) {
      return Response.json(
        {
          error:
            "No DAT/Truckstop capacity candidates were saved. Check provider endpoint configuration or add candidates manually.",
          providerStatus: result.providerStatus,
        },
        { status: 400 },
      );
    }

    return Response.json({
      message: `${result.savedCount} marketplace capacity candidate${
        result.savedCount === 1 ? "" : "s"
      } saved.`,
      providerStatus: result.providerStatus,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search marketplace capacity.",
      },
      { status: 400 },
    );
  }
}
