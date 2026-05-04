import { z } from "zod";

// If running in production on hosts like Railway and no DATABASE_URL is provided,
// default to a file path under `/data` which is the conventional mount point
// for project volumes. This keeps SQLite working with an attached Volume.
if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  process.env.DATABASE_URL = "file:/data/app.db";
}

const authEnvSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long."),
  JWT_EXPIRES_IN: z
    .string()
    .regex(
      /^\d+[smhd]$/,
      "JWT_EXPIRES_IN must use a compact format like 30m, 12h, or 7d."
    )
    .default("7d"),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
});

const securityEnvSchema = z.object({
  BCRYPT_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10, "BCRYPT_SALT_ROUNDS should be at least 10.")
    .max(14, "BCRYPT_SALT_ROUNDS should not exceed 14.")
    .default(12),
});

export const authEnv = authEnvSchema.parse(process.env);
export const databaseEnv = databaseEnvSchema.parse(process.env);
export const securityEnv = securityEnvSchema.parse(process.env);
