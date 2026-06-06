import { getPrintableCustomerInvoice } from "@/lib/invoice";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const printable = await getPrintableCustomerInvoice(id);

    return new Response(printable.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Unable to open invoice.",
      { status: 404 },
    );
  }
}
