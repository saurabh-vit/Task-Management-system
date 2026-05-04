import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { RoleName, SessionTokenPayload } from "@/lib/auth/types";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { prisma } from "@/lib/prisma";

const userAccessInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

const userDashboardInclude = {
  userRoles: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithAccess = Prisma.UserGetPayload<{
  include: typeof userAccessInclude;
}>;

export type DashboardUser = Prisma.UserGetPayload<{
  include: typeof userDashboardInclude;
}>;

export interface AssignableUser {
  id: string;
  name: string | null;
  email: string;
}

export type TeamAccessUser = DashboardUser;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildSessionPayload(user: UserWithAccess): SessionTokenPayload {
  const roles = Array.from(
    new Set(user.userRoles.map((userRole) => userRole.role.name as RoleName))
  );

  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((userRole) =>
        userRole.role.rolePermissions.map(
          (rolePermission) => rolePermission.permission.key
        )
      )
    )
  );

  return {
    sub: user.id,
    email: user.email,
    name: user.name ?? undefined,
    roles,
    permissions,
  };
}

export async function countUsers() {
  await ensureDatabaseReady();
  return prisma.user.count();
}

export async function findUserByEmail(email: string) {
  await ensureDatabaseReady();

  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    include: userAccessInclude,
  });
}

export async function findUserById(userId: string) {
  await ensureDatabaseReady();

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: userAccessInclude,
  });
}

export async function getCurrentUserRecord(userId: string) {
  await ensureDatabaseReady();

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: userDashboardInclude,
  });
}

export async function getRoleByName(name: RoleName) {
  await ensureDatabaseReady();

  return prisma.role.findUnique({
    where: {
      name,
    },
  });
}

export async function listAssignableUsers() {
  await ensureDatabaseReady();

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  }) as Promise<AssignableUser[]>;
}

export async function listTeamAccessUsers() {
  await ensureDatabaseReady();

  return prisma.user.findMany({
    include: userDashboardInclude,
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
}
