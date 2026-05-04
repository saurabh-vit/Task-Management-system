import "server-only";

import bcrypt from "bcrypt";

import { securityEnv } from "@/lib/env";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, securityEnv.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
