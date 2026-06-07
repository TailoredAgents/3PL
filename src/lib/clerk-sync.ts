import { clerkClient } from "@clerk/nextjs/server";
import type { UserJSON } from "@clerk/backend";
import type { UserRole as PrismaUserRole } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { isClerkAuthConfigured, parseInternalRole } from "@/lib/auth";
import type { InternalUserView } from "@/lib/current-user";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export function isClerkWebhookConfigured() {
  return Boolean(process.env.CLERK_WEBHOOK_SIGNING_SECRET);
}

export function getClerkRedirectUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ||
    "";

  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/dashboard` : undefined;
}

export async function inviteOrSyncClerkUser(input: {
  userId: string;
  name: string;
  email: string;
  role: PrismaUserRole;
  currentUser?: InternalUserView | null;
}) {
  if (!hasDatabaseUrl() || !prisma || !isClerkAuthConfigured()) {
    return {
      status: "skipped" as const,
      message: "Clerk is not configured; local user saved only.",
    };
  }

  const localUser = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!localUser) {
    throw new Error("Internal user not found.");
  }

  const client = await clerkClient();
  const publicMetadata = {
    role: input.role,
    internalUserId: input.userId,
  };

  if (localUser.clerkUserId) {
    await client.users.updateUserMetadata(localUser.clerkUserId, {
      publicMetadata,
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        invitationStatus: "accepted",
        lastClerkSyncedAt: new Date(),
        deactivatedAt: null,
      },
    });
    await logAudit({
      action: "CLERK_USER_METADATA_SYNCED",
      entityType: "User",
      entityId: input.userId,
      summary: `${input.name} role synced to Clerk.`,
      user: input.currentUser,
      afterJson: publicMetadata,
    });

    return {
      status: "synced" as const,
      message: "Existing Clerk user metadata synced.",
    };
  }

  const invitation = await client.invitations.createInvitation({
    emailAddress: input.email,
    ignoreExisting: true,
    notify: true,
    publicMetadata,
    redirectUrl: getClerkRedirectUrl(),
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      clerkInvitationId: invitation.id,
      invitationStatus: invitation.status ?? "pending",
      invitationSentAt: new Date(),
      lastClerkSyncedAt: new Date(),
      deactivatedAt: null,
    },
  });
  await logAudit({
    action: "CLERK_INVITATION_SENT",
    entityType: "User",
    entityId: input.userId,
    summary: `Clerk invitation sent to ${input.email}.`,
    user: input.currentUser,
    afterJson: {
      clerkInvitationId: invitation.id,
      invitationStatus: invitation.status,
    },
  });

  return {
    status: "invited" as const,
    message: "Clerk invitation sent.",
  };
}

export async function syncClerkUserFromWebhook(data: UserJSON) {
  if (!hasDatabaseUrl() || !prisma) {
    return null;
  }

  const email = getPrimaryEmail(data);
  if (!email) {
    throw new Error("Clerk user webhook did not include an email address.");
  }

  const role =
    parseInternalRole(data.public_metadata?.role) ??
    (await getRoleFromExistingUser(data.id, email)) ??
    "SALES";
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    email;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ clerkUserId: data.id }, { email }] },
  });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          clerkUserId: data.id,
          name,
          email,
          role,
          invitationStatus: "accepted",
          lastClerkSyncedAt: new Date(),
          deactivatedAt: null,
        },
      })
    : await prisma.user.create({
        data: {
          clerkUserId: data.id,
          name,
          email,
          role,
          invitationStatus: "accepted",
          lastClerkSyncedAt: new Date(),
        },
      });

  await logAudit({
    action: existing ? "CLERK_USER_SYNCED" : "CLERK_USER_CREATED",
    entityType: "User",
    entityId: user.id,
    summary: `${user.email} synced from Clerk ${data.id}.`,
    beforeJson: existing
      ? {
          clerkUserId: existing.clerkUserId,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        }
      : null,
    afterJson: {
      clerkUserId: user.clerkUserId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  return user;
}

export async function markClerkUserDeletedFromWebhook(data: {
  id?: string | null;
}) {
  if (!hasDatabaseUrl() || !prisma || !data.id) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: data.id },
  });

  if (!existing) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      clerkUserId: null,
      invitationStatus: "deleted",
      deactivatedAt: new Date(),
      lastClerkSyncedAt: new Date(),
    },
  });

  await logAudit({
    action: "CLERK_USER_DEACTIVATED",
    entityType: "User",
    entityId: user.id,
    summary: `${user.email} was marked deactivated after Clerk deletion.`,
    beforeJson: {
      clerkUserId: existing.clerkUserId,
      invitationStatus: existing.invitationStatus,
    },
    afterJson: {
      clerkUserId: null,
      invitationStatus: user.invitationStatus,
      deactivatedAt: user.deactivatedAt,
    },
  });

  return user;
}

function getPrimaryEmail(data: UserJSON) {
  const primary = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id,
  );

  return primary?.email_address ?? data.email_addresses[0]?.email_address;
}

async function getRoleFromExistingUser(
  clerkUserId: string,
  email: string,
): Promise<PrismaUserRole | null> {
  if (!prisma) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ clerkUserId }, { email }] },
    select: { role: true },
  });

  return user?.role ?? null;
}
