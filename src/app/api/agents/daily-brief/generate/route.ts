import { generateDailyBrief } from "@/lib/daily-brief";

export async function POST() {
  try {
    const brief = await generateDailyBrief();

    return Response.json({
      message: "Daily brief generated. Review the ordered actions before executing work.",
      brief,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate daily brief.",
      },
      { status: 400 },
    );
  }
}
