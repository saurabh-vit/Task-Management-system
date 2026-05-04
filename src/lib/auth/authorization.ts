import { NextResponse } from "next/server";

import { ROLE_HIERARCHY } from "@/lib/auth/constants";
import type {
  AuthorizationResult,
  RoleName,
  SessionTokenPayload,
  TaskAccessContext,
} from "@/lib/auth/types";

function allow(): AuthorizationResult {
  return {
    ok: true,
    status: 200,
    message: "",
  };
}

function deny(message = "You do not have permission to access this resource.") {
  return {
    ok: false,
    status: 403,
    message,
  } satisfies AuthorizationResult;
}

export class AuthorizationError extends Error {
  status = 403;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function authorizeRole(
  session: SessionTokenPayload | null,
  allowedRoles: readonly RoleName[]
) {
  if (!session || allowedRoles.length === 0) {
    return deny();
  }

  if (session.roles.includes("Admin")) {
    return allow();
  }

  const hasAllowedRole = session.roles.some((userRole) =>
    allowedRoles.some(
      (allowedRole) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[allowedRole]
    )
  );

  return hasAllowedRole ? allow() : deny();
}

export function authorizeTaskAccess(
  session: SessionTokenPayload | null,
  context: TaskAccessContext
) {
  if (!session) {
    return deny();
  }

  if (session.roles.includes("Admin")) {
    return allow();
  }

  if (session.roles.includes("Manager")) {
    // Without a dedicated team model yet, manager scope is limited to tasks
    // they created or are explicitly assigned to.
    const managerCanAccess =
      context.creatorUserId === session.sub ||
      context.assigneeUserIds.includes(session.sub);

    return managerCanAccess
      ? allow()
      : deny("Managers can only access tasks they created or are assigned to.");
  }

  return context.assigneeUserIds.includes(session.sub)
    ? allow()
    : deny("Users can only access their own task assignments.");
}

export function assertAuthorized(result: AuthorizationResult) {
  if (!result.ok) {
    throw new AuthorizationError(result.message);
  }
}

export function authorizationFailureResponse(result: AuthorizationResult) {
  return NextResponse.json(
    {
      error: result.message,
    },
    {
      status: result.status,
    }
  );
}
