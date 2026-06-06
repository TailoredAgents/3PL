import { downloadStoredFile } from "@/lib/storage";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ error: "Database is not configured." }, { status: 503 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      fileName: true,
      fileUrl: true,
      storageKey: true,
      mimeType: true,
    },
  });

  if (!document) {
    return Response.json({ error: "Document not found." }, { status: 404 });
  }

  if (document.storageKey) {
    const storedFile = await downloadStoredFile(document.storageKey);
    return new Response(Buffer.from(storedFile.body), {
      headers: {
        "Content-Type": document.mimeType ?? storedFile.contentType,
        "Content-Length": String(storedFile.contentLength),
        "Content-Disposition": `attachment; filename="${sanitizeHeaderFileName(
          document.fileName,
        )}"`,
      },
    });
  }

  if (document.fileUrl.startsWith("pending-storage://")) {
    return Response.json(
      { error: "This document has no stored file yet." },
      { status: 404 },
    );
  }

  return Response.redirect(
    new URL(document.fileUrl, process.env.NEXT_PUBLIC_APP_URL ?? request.url),
  );
}

function sanitizeHeaderFileName(fileName: string) {
  return fileName.replace(/["\r\n]/g, "_");
}
