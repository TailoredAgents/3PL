import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { carrierAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { buildRateConfirmationPdf } from "@/lib/rate-confirmation";
import { formValue } from "@/lib/server-utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ loadId: string }> },
) {
  const { loadId } = await context.params;
  const cookieStore = await cookies();
  const carrierId = verifyPortalSessionToken(
    "carrier",
    cookieStore.get(carrierAuthCookie)?.value,
  );

  if (!carrierId) {
    return Response.json(
      { error: "Not logged in to carrier portal." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const signerName = formValue(formData, "signerName")?.trim();
  const signerTitle = formValue(formData, "signerTitle")?.trim();
  const signatureConsent = formData.get("signatureConsent") === "on";

  if (!signerName || !signerTitle || !signatureConsent) {
    return Response.json(
      {
        error:
          "Signer name, title, and signature authorization are required.",
      },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Rate confirmation signature validated. Connect DATABASE_URL to persist signatures.",
    });
  }

  const load = await prisma.load.findFirst({
    where: { id: loadId, carrierId },
    include: {
      shipper: { select: { companyName: true } },
      carrier: { select: { companyName: true } },
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!load) {
    return Response.json(
      { error: "Rate confirmation not found for this carrier." },
      { status: 404 },
    );
  }

  if (load.rateConfirmationStatus === "SIGNED") {
    return Response.redirect(new URL("/carrier-portal", request.url));
  }

  if (!["DRAFTED", "SENT"].includes(load.rateConfirmationStatus)) {
    return Response.json(
      { error: "This load does not have a rate confirmation ready to sign." },
      { status: 400 },
    );
  }

  const rateConfirmation = load.documents[0];

  if (!rateConfirmation?.extractedText) {
    return Response.json(
      { error: "The broker must generate the rate confirmation before signature." },
      { status: 400 },
    );
  }

  const now = new Date();
  const signedText = appendCarrierSignature(rateConfirmation.extractedText, {
    signerName,
    signerTitle,
    carrier: load.carrier?.companyName ?? "Carrier",
    signedAt: now,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  const signedPdf = buildRateConfirmationPdf(signedText);

  await prisma.$transaction([
    prisma.document.update({
      where: { id: rateConfirmation.id },
      data: {
        fileName: `rate-confirmation-${formatLoadNumber(load.loadNumber)}-signed.pdf`,
        fileUrl: `/api/loads/${load.id}/rate-confirmation/pdf`,
        mimeType: "application/pdf",
        extractedText: signedText,
        fileSize: signedPdf.length,
      },
    }),
    prisma.load.update({
      where: { id: load.id },
      data: {
        rateConfirmationStatus: "SIGNED",
        rateConfirmationSignedAt: now,
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `Rate confirmation signed in carrier portal by ${signerName}, ${signerTitle}.`,
        occurredAt: now,
      },
    }),
    prisma.activity.create({
      data: {
        shipperId: load.shipperId,
        type: "NOTE",
        direction: "INBOUND",
        subject: "Carrier signed rate confirmation",
        body: `${load.carrier?.companyName ?? "Carrier"} signed ${formatLoadNumber(
          load.loadNumber,
        )}. Signer: ${signerName}, ${signerTitle}.`,
        outcome: "Rate confirmation signed",
      },
    }),
  ]);

  revalidatePath("/carrier-portal");
  revalidatePath("/documents");
  revalidatePath("/loads");
  revalidatePath(`/loads/${load.id}`);
  revalidatePath("/tracking");
  revalidatePath("/dashboard");

  return Response.redirect(new URL("/carrier-portal", request.url));
}

function appendCarrierSignature(
  content: string,
  input: {
    signerName: string;
    signerTitle: string;
    carrier: string;
    signedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  },
) {
  return [
    content.trimEnd(),
    "",
    "Electronic Carrier Signature",
    `Carrier: ${input.carrier}`,
    `Signer: ${input.signerName}`,
    `Title: ${input.signerTitle}`,
    `Signed at: ${formatDateTime(input.signedAt)}`,
    `IP address: ${input.ipAddress ?? "Not captured"}`,
    `User agent: ${input.userAgent ?? "Not captured"}`,
    "Authorization: Carrier accepted the rate confirmation terms through the carrier portal.",
  ].join("\n");
}

function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function formatLoadNumber(loadNumber: number | null) {
  return `LD-${String(loadNumber ?? "").padStart(4, "0")}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
