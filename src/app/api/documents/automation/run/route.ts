import { runPendingDocumentAutomation } from "@/lib/document-automation";

export async function POST() {
  try {
    const result = await runPendingDocumentAutomation();

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run document automation.",
      },
      { status: 400 },
    );
  }
}
