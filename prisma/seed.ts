import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const permissionsByRole = {
  Admin: [
    "task:create",
    "task:read",
    "task:update",
    "task:delete",
    "task:assign",
    "audit:read",
    "user:manage",
    "role:manage",
  ],
  Manager: ["task:create", "task:read", "task:update", "task:assign"],
  User: ["task:read", "task:update"],
} as const;

const permissionCatalog = [
  ["task:create", "Create tasks"],
  ["task:read", "Read tasks"],
  ["task:update", "Update tasks"],
  ["task:delete", "Delete tasks"],
  ["task:assign", "Assign users to tasks"],
  ["audit:read", "Read audit logs"],
  ["user:manage", "Manage users"],
  ["role:manage", "Manage roles and permissions"],
] as const;

async function main() {
  for (const [key, description] of permissionCatalog) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  for (const [name, permissions] of Object.entries(permissionsByRole)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description: `${name} base role`,
      },
      create: {
        name,
        description: `${name} base role`,
      },
    });

    for (const permissionKey of permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("Seed completed: roles and permissions are ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
