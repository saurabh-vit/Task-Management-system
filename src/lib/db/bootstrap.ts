import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { databaseEnv } from "@/lib/env";
import { resolveSqliteFilePath } from "@/lib/db/sqlite";

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

const permissionDescriptions = {
  "task:create": "Create tasks",
  "task:read": "Read tasks",
  "task:update": "Update tasks",
  "task:delete": "Delete tasks",
  "task:assign": "Assign users to tasks",
  "audit:read": "Read audit logs",
  "user:manage": "Manage users",
  "role:manage": "Manage roles and permissions",
} as const;

const globalForDatabaseBootstrap = globalThis as typeof globalThis & {
  databaseReadyPromise?: Promise<void>;
};

const MIGRATION_SQL = `-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'To Do',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectRole" TEXT NOT NULL DEFAULT 'ASSIGNEE',
    PRIMARY KEY ("taskId", "userId"),
    CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" JSONB,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- CreateIndex
CREATE INDEX "TaskAssignment_projectRole_idx" ON "TaskAssignment"("projectRole");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
`;

function seedAccessControl(db: InstanceType<typeof Database>) {
  const timestamp = new Date().toISOString();
  const selectRole = db.prepare('SELECT id FROM "Role" WHERE name = ?');
  const insertRole = db.prepare(`
    INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateRole = db.prepare(`
    UPDATE "Role"
    SET "description" = ?, "updatedAt" = ?
    WHERE "id" = ?
  `);

  const selectPermission = db.prepare(
    'SELECT id FROM "Permission" WHERE "key" = ?'
  );
  const insertPermission = db.prepare(`
    INSERT INTO "Permission" ("id", "key", "description", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?)
  `);
  const updatePermission = db.prepare(`
    UPDATE "Permission"
    SET "description" = ?, "updatedAt" = ?
    WHERE "id" = ?
  `);

  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const roleName of Object.keys(permissionsByRole) as Array<
      keyof typeof permissionsByRole
    >) {
      const existingRole = selectRole.get(roleName) as { id: string } | undefined;
      const roleId = existingRole?.id ?? randomUUID();

      if (existingRole) {
        updateRole.run(`${roleName} base role`, timestamp, roleId);
      } else {
        insertRole.run(
          roleId,
          roleName,
          `${roleName} base role`,
          timestamp,
          timestamp
        );
      }

      for (const permissionKey of permissionsByRole[roleName]) {
        const existingPermission = selectPermission.get(permissionKey) as
          | { id: string }
          | undefined;
        const permissionId = existingPermission?.id ?? randomUUID();
        const description = permissionDescriptions[permissionKey];

        if (existingPermission) {
          updatePermission.run(description, timestamp, permissionId);
        } else {
          insertPermission.run(
            permissionId,
            permissionKey,
            description,
            timestamp,
            timestamp
          );
        }

        insertRolePermission.run(roleId, permissionId, timestamp);
      }
    }
  });

  transaction();
}

async function bootstrapDatabase() {
  const databasePath = resolveSqliteFilePath(databaseEnv.DATABASE_URL);

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);

  try {
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");

    const hasUserTable = db
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'User'
      `)
      .get();

    if (!hasUserTable) {
      db.exec(MIGRATION_SQL);
    }

    seedAccessControl(db);
  } finally {
    db.close();
  }
}

export async function ensureDatabaseReady() {
  if (!globalForDatabaseBootstrap.databaseReadyPromise) {
    globalForDatabaseBootstrap.databaseReadyPromise = bootstrapDatabase().catch(
      (error) => {
        globalForDatabaseBootstrap.databaseReadyPromise = undefined;
        throw error;
      }
    );
  }

  await globalForDatabaseBootstrap.databaseReadyPromise;
}
