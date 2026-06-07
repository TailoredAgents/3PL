import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";

import {
  isClerkAuthConfigured,
  parseInternalRole,
  type InternalRole,
} from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type InternalUserView = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function getCurrentInternalUser(): Promise<InternalUserView | null> {
  if (!isClerkAuthConfigured() || !hasDatabaseUrl() || !prisma) {
    return null;
  }

  try {
    const authState = await auth();

    if (!authState.userId) {
      return null;
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return null;
    }

    const clerkRole = parseInternalRole(clerkUser.publicMetadata.role);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId: authState.userId }, { email }],
      },
    });
    const role = existing?.role ?? clerkRole ?? (await getBootstrapRole());
    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email;

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            clerkUserId: authState.userId,
            email,
            name,
            role: clerkRole ?? existing.role,
            invitationStatus: "accepted",
            lastClerkSyncedAt: new Date(),
            deactivatedAt: null,
          },
        })
      : await prisma.user.create({
          data: {
            clerkUserId: authState.userId,
            email,
            name,
            role,
            invitationStatus: "accepted",
            lastClerkSyncedAt: new Date(),
          },
        });

    return {
      id: user.id,
      clerkUserId: user.clerkUserId ?? authState.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireInternalRole(allowedRoles: InternalRole[]) {
  if (!isClerkAuthConfigured()) {
    return null;
  }

  const user = await getCurrentInternalUser();

  if (!user) {
    throw new Error("Internal user not found.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return user;
}

export async function guardInternalRole(
  allowedRoles: InternalRole[],
  fallbackMessage: string,
) {
  try {
    return {
      currentUser: await requireInternalRole(allowedRoles),
      response: null,
    };
  } catch (error) {
    return {
      currentUser: null,
      response: Response.json(
        {
          error:
            error instanceof Error ? error.message : fallbackMessage,
        },
        { status: 403 },
      ),
    };
  }
}

async function getBootstrapRole(): Promise<UserRole> {
  if (!prisma) {
    return "SALES";
  }

  const existingUsers = await prisma.user.count();
  return existingUsers === 0 ? "OWNER" : "SALES";
}
