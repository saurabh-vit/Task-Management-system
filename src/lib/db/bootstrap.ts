import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { databaseEnv } from "@/lib/env";

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

function resolveSqliteFilePath(url: string) {
  if (!url.startsWith("file:")) {
    throw new Error("Only file-based SQLite URLs are supported in this app.");
  }

  const filePath = url.slice("file:".length);

  if (!filePath) {
    throw new Error("The SQLite DATABASE_URL is missing a file path.");
  }

  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), filePath);
}

function readMigrationSql() {
  const migrationFile = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "prisma",
    "migrations",
    "202605040001_phase2_init",
    "migration.sql"
  );

  return fs.readFileSync(migrationFile, "utf8");
}

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
      db.exec(readMigrationSql());
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
