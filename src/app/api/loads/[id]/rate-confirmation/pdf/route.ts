import { getRateConfirmationPdf } from "@/lib/rate-confirmation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const printable = await getRateConfirmationPdf(id);

    return new Response(printable.pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(printable.pdf.length),
        "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(
          printable.title,
        )}"`,
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Unable to open rate confirmation PDF.",
      { status: 404 },
    );
  }
}

function sanitizeHeaderFileName(fileName: string) {
  return fileName.replace(/["\r\n]/g, "_");
}
