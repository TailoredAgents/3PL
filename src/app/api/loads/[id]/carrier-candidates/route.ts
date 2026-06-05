import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue, nullableString } from "@/lib/server-utils";
import { carrierSourcingCandidateCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = carrierSourcingCandidateCreateSchema.safeParse({
    source: formValue(formData, "source") ?? "MANUAL",
    companyName: formValue(formData, "companyName"),
    contactName: formValue(formData, "contactName"),
    phone: formValue(formData, "phone"),
    email: formValue(formData, "email") ?? "",
    mcNumber: formValue(formData, "mcNumber"),
    dotNumber: formValue(formData, "dotNumber"),
    suggestedRate: formValue(formData, "suggestedRate") ?? "",
    matchScore: formValue(formData, "matchScore") ?? "",
    complianceSnapshot: formValue(formData, "complianceSnapshot"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a carrier candidate company name." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Carrier candidate validated. Connect DATABASE_URL to persist sourcing candidates.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  const carrier = await findMatchingCarrier({
    companyName: input.companyName,
    mcNumber: nullableString(input.mcNumber),
    dotNumber: nullableString(input.dotNumber),
  });

  await prisma.carrierSourcingCandidate.create({
    data: {
      loadId: load.id,
      carrierId: carrier?.id,
      source: input.source,
      status: "NEW",
      companyName: input.companyName,
      contactName: nullableString(input.contactName),
      phone: nullableString(input.phone),
      email: nullableString(input.email),
      mcNumber: nullableString(input.mcNumber),
      dotNumber: nullableString(input.dotNumber),
      suggestedRate:
        typeof input.suggestedRate === "number" ? input.suggestedRate : null,
      matchScore: typeof input.matchScore === "number" ? input.matchScore : null,
      complianceSnapshot: nullableString(input.complianceSnapshot),
      notes: nullableString(input.notes),
    },
  });

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/carriers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Carrier candidate saved." });
}

async function findMatchingCarrier(input: {
  companyName: string;
  mcNumber: string | null;
  dotNumber: string | null;
}) {
  if (!prisma) {
    return null;
  }

  return prisma.carrier.findFirst({
    where: {
      OR: [
        {
          companyName: {
            equals: input.companyName,
            mode: "insensitive",
          },
        },
        ...(input.mcNumber ? [{ mcNumber: input.mcNumber }] : []),
        ...(input.dotNumber ? [{ dotNumber: input.dotNumber }] : []),
      ],
    },
  });
}
