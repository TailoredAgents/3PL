import { revalidatePath } from "next/cache";

import { getCurrentInternalUser } from "@/lib/current-user";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue } from "@/lib/server-utils";
import { quoteStatusUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = quoteStatusUpdateSchema.safeParse({
    status: formValue(formData, "status"),
    note: formValue(formData, "note"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose a valid quote status." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Quote status validated. Connect DATABASE_URL to persist status changes.",
    });
  }

  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      customerQuotes: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quoteRequest) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const input = parsed.data;
  const currentUser = await getCurrentInternalUser();
  const latestQuote = quoteRequest.customerQuotes[0];

  await prisma.$transaction([
    prisma.quoteRequest.update({
      where: { id },
      data: { status: input.status },
    }),
    ...(latestQuote && ["QUOTED", "ACCEPTED", "REJECTED"].includes(input.status)
      ? [
          prisma.customerQuote.update({
            where: { id: latestQuote.id },
            data: {
              status:
                input.status === "QUOTED"
                  ? "SENT"
                  : input.status === "ACCEPTED"
                    ? "ACCEPTED"
                    : "REJECTED",
            },
          }),
        ]
      : []),
    prisma.activity.create({
      data: {
        shipperId: quoteRequest.shipperId,
        contactId: quoteRequest.contactId,
        userId: currentUser?.id,
        type: "NOTE",
        direction: "INTERNAL",
        subject: `Quote marked ${input.status.toLowerCase()}`,
        body:
          input.note ??
          `Quote request status changed to ${input.status.toLowerCase()}.`,
        outcome: input.status,
      },
    }),
  ]);

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Quote status updated." });
}
