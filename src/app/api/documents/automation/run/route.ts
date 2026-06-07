import { guardInternalRole } from "@/lib/current-user";
import { runPendingDocumentAutomation } from "@/lib/document-automation";

export async function POST() {
  const guard = await guardInternalRole(
    ["OWNER", "ADMIN", "OPS"],
    "You do not have permission to run document automation.",
  );
  if (guard.response) return guard.response;

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
