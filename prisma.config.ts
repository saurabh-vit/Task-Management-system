import "dotenv/config";
import { defineConfig } from "prisma/config";

import { normalizeSqliteDatabaseUrl } from "./src/lib/db/sqlite";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL
      ? normalizeSqliteDatabaseUrl(process.env.DATABASE_URL)
      : undefined,
  },
});