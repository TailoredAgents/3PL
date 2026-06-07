import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  fetchAndStoreMarketRates,
  formatProviderStatusForMessage,
  getProviderStatusSummary,
} from "@/lib/rating/rate-intelligence";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Market rate fetch validated. Connect DATABASE_URL to persist market benchmarks.",
    });
  }

  try {
    const result = await fetchAndStoreMarketRates(id);
    const status = getProviderStatusSummary(result.providerResults);

    if (!result.savedCount) {
      return Response.json(
        {
          error:
            `No DAT/Truckstop market rates were saved. ${formatProviderStatusForMessage(result.providerResults)}. Add credentials/endpoints or save a manual benchmark.`,
          providerStatus: status,
        },
        { status: 400 },
      );
    }

    await prisma.quoteRequest.update({
      where: { id },
      data: { status: "PRICING" },
    });

    revalidatePath("/quote-requests");
    revalidatePath(`/quote-requests/${id}`);
    revalidatePath("/dashboard");

    return Response.json({
      message: `${result.savedCount} market rate benchmark${
        result.savedCount === 1 ? "" : "s"
      } saved. ${formatProviderStatusForMessage(result.providerResults)}.`,
      providerStatus: status,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch market rates.",
      },
      { status: 400 },
    );
  }
}
