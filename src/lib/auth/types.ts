import type { JWTPayload } from "jose";

export type RoleName = "Admin" | "Manager" | "User";

export interface SessionTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name?: string;
  roles: RoleName[];
  permissions: string[];
}

export type AuthorizationResult =
  | {
      ok: true;
      status: 200;
      message: string;
    }
  | {
      ok: false;
      status: 403;
      message: string;
    };

export interface TaskAccessContext {
  creatorUserId: string;
  assigneeUserIds: string[];
}
