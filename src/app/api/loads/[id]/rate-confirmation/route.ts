import { revalidatePath } from "next/cache";

import { formValue, nullableString } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { rateConfirmationUpdateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/rate-confirmation">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = rateConfirmationUpdateSchema.safeParse({
    rateConfirmationStatus:
      formValue(formData, "rateConfirmationStatus") ?? "NOT_STARTED",
    fileName: formValue(formData, "fileName"),
    fileUrl: formValue(formData, "fileUrl"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose a rate confirmation status." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Rate confirmation update validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: {
      id: true,
      shipperId: true,
      loadNumber: true,
      originCity: true,
      originState: true,
      destinationCity: true,
      destinationState: true,
      pickupDate: true,
    },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  const now = new Date();
  const sentAt =
    input.rateConfirmationStatus === "SENT" ||
    input.rateConfirmationStatus === "SIGNED"
      ? now
      : undefined;
  const signedAt = input.rateConfirmationStatus === "SIGNED" ? now : undefined;

  await prisma.$transaction([
    prisma.load.update({
      where: { id },
      data: {
        rateConfirmationStatus: input.rateConfirmationStatus,
        rateConfirmationSentAt: sentAt,
        rateConfirmationSignedAt: signedAt,
      },
    }),
    ...(input.fileName
      ? [
          prisma.document.create({
            data: {
              loadId: load.id,
              shipperId: load.shipperId,
              type: "RATE_CONFIRMATION",
              fileName: input.fileName,
              fileUrl: input.fileUrl || `pending-storage://${input.fileName}`,
              extractedText: nullableString(input.notes),
            },
          }),
        ]
      : []),
    prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: [
          `Rate confirmation ${input.rateConfirmationStatus.toLowerCase().replace("_", " ")}.`,
          nullableString(input.notes),
        ]
          .filter(Boolean)
          .join(" "),
        occurredAt: now,
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Rate confirmation updated." });
}
