import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { generateCustomerInvoiceDocument } from "@/lib/invoice";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Invoice document generation validated. Connect DATABASE_URL to persist.",
    });
  }

  try {
    const document = await generateCustomerInvoiceDocument(id);

    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return Response.json({
      message: "Customer invoice document generated.",
      fileUrl: document.fileUrl,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate invoice document.",
      },
      { status: 400 },
    );
  }
}
