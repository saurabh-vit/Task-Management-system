import { SignJWT, jwtVerify } from "jose";

import { authEnv } from "@/lib/env";
import type { SessionTokenPayload } from "@/lib/auth/types";

const secret = new TextEncoder().encode(authEnv.JWT_SECRET);

type TokenPayloadInput = Pick<
  SessionTokenPayload,
  "sub" | "email" | "name" | "roles" | "permissions"
>;

type JwtExpiresIn = `${number}${"s" | "m" | "h" | "d"}`;

export async function signToken(payload: TokenPayloadInput) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    roles: payload.roles,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(authEnv.JWT_EXPIRES_IN as JwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionTokenPayload>(token, secret, {
      algorithms: ["HS256"],
    });

    return payload;
  } catch {
    return null;
  }
}
