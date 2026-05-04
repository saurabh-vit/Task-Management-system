import "server-only";

import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/constants";
import { AuthorizationError } from "@/lib/auth/authorization";
import { signToken, verifyToken } from "@/lib/auth/jwt";
import type { SessionTokenPayload } from "@/lib/auth/types";

type SessionCookiePayload = Pick<
  SessionTokenPayload,
  "sub" | "email" | "name" | "roles" | "permissions"
>;

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return verifyToken(token);
}

export async function getRequiredSession() {
  const session = await getSession();

  if (!session) {
    throw new AuthorizationError(
      "You do not have permission to access this resource."
    );
  }

  return session;
}

export async function setSessionCookie(payload: SessionCookiePayload) {
  const cookieStore = await cookies();
  const token = await signToken(payload);

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return token;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
