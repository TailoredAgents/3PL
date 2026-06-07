import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { customerAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue, nullableString } from "@/lib/server-utils";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const shipperId = verifyPortalSessionToken(
    "customer",
    cookieStore.get(customerAuthCookie)?.value,
  );

  if (!shipperId) {
    return Response.json({ error: "Not logged in to portal." }, { status: 401 });
  }

  const formData = await request.formData();
  const action = formValue(formData, "action");

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Portal preferences validated. Connect DATABASE_URL to persist.",
    });
  }

  const shipper = await prisma.shipper.findUnique({
    where: { id: shipperId },
    select: { id: true, notes: true, portalEnabled: true },
  });

  if (!shipper?.portalEnabled) {
    return Response.json({ error: "Portal access not enabled." }, { status: 403 });
  }

  if (action === "lanes") {
    const lanes = formValue(formData, "lanes") ?? "";

    await prisma.shipper.update({
      where: { id: shipperId },
      data: {
        notes: setNotesField(shipper.notes ?? "", "Lanes", lanes) || null,
      },
    });

    revalidatePortalPaths(shipperId);
    return Response.json({ message: "Lanes updated." });
  }

  if (action === "contact") {
    const firstName = formValue(formData, "firstName");
    if (!firstName) {
      return Response.json({ error: "First name is required." }, { status: 400 });
    }

    const isPrimary = formData.get("isPrimary") === "true";

    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { shipperId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    await prisma.contact.create({
      data: {
        shipperId,
        firstName,
        lastName: nullableString(formValue(formData, "lastName")),
        title: nullableString(formValue(formData, "title")),
        email: nullableString(formValue(formData, "email")),
        phone: nullableString(formValue(formData, "phone")),
        isPrimary,
      },
    });

    revalidatePortalPaths(shipperId);
    return Response.json({ message: "Contact added." });
  }

  return Response.json({ error: "Unknown preference action." }, { status: 400 });
}

function revalidatePortalPaths(shipperId: string) {
  revalidatePath("/portal");
  revalidatePath(`/shippers/${shipperId}`);
  revalidatePath("/shippers");
}

function setNotesField(notes: string, field: string, value: string): string {
  const prefix = `${field}:`;
  const lines = notes.split("\n");
  const idx = lines.findIndex((line) => line.trim().startsWith(prefix));

  if (!value) {
    if (idx >= 0) {
      lines.splice(idx, 1);
    }
    return lines.join("\n").trim();
  }

  const newLine = `${prefix} ${value}`;
  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    lines.push(newLine);
  }

  return lines.join("\n").trim();
}
