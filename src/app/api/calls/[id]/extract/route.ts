import { revalidatePath } from "next/cache";

import { getCallAiContext } from "@/lib/calls";
import { runCallIntakeAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Call extraction validated. Connect DATABASE_URL to persist calls.",
    });
  }

  const contextData = await getCallAiContext(id);

  if (!contextData?.call.transcriptText) {
    return Response.json(
      { error: "Add or receive a transcript before running extraction." },
      { status: 400 },
    );
  }

  try {
    const agentResult = await runCallIntakeAgent({
      transcriptText: contextData.call.transcriptText,
      context: contextData,
    });

    await prisma.$transaction([
      prisma.brokerageCall.update({
        where: { id },
        data: {
          aiSummary: agentResult.summary,
          aiExtractedJson: {
            quoteRequest: agentResult.quoteRequest,
            nextAction: agentResult.nextAction,
            confidence: agentResult.confidence,
          },
          missingQuestions: agentResult.missingQuestions,
          extractionStatus: "NEEDS_REVIEW",
        },
      }),
      prisma.aiAgentRun.create({
        data: {
          agentName: "Call Intake Agent",
          relatedEntityType: "BrokerageCall",
          relatedEntityId: id,
          status: "COMPLETED",
          prompt: "Template: Call Intake Agent",
          inputJson: contextData,
          outputJson: agentResult,
          confidence: agentResult.confidence,
        },
      }),
    ]);

    revalidatePath("/calls");
    revalidatePath(`/calls/${id}`);
    revalidatePath("/dashboard");

    return Response.json({
      message: "Call intake extraction completed.",
      agentResult,
    });
  } catch (error) {
    await prisma.aiAgentRun.create({
      data: {
        agentName: "Call Intake Agent",
        relatedEntityType: "BrokerageCall",
        relatedEntityId: id,
        status: "FAILED",
        inputJson: contextData,
        errorMessage:
          error instanceof Error ? error.message : "Unknown call extraction error.",
      },
    });

    return Response.json(
      { error: "Call extraction failed. Review AI configuration and try again." },
      { status: 500 },
    );
  }
}
