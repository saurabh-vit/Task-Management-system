export const AUTH_COOKIE_NAME = "ethara_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export const ROLE_HIERARCHY = {
  Admin: 3,
  Manager: 2,
  User: 1,
} as const;

export const PROTECTED_ROUTE_POLICIES = [
  { prefix: "/dashboard", allowedRoles: ["User"] as const },
  { prefix: "/tasks", allowedRoles: ["User"] as const },
  { prefix: "/admin", allowedRoles: ["Admin"] as const },
] as const;
