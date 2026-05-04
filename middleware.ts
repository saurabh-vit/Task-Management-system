import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  PROTECTED_ROUTE_POLICIES,
  AUTH_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  authorizationFailureResponse,
  authorizeRole,
} from "@/lib/auth/authorization";
import { verifyToken } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const policy = PROTECTED_ROUTE_POLICIES.find(({ prefix }) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!policy) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifyToken(token);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const result = authorizeRole(session, policy.allowedRoles);

  if (!result.ok) {
    return authorizationFailureResponse(result);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tasks/:path*", "/admin/:path*"],
};
