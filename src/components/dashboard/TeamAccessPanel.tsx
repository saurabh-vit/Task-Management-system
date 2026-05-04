import { updateUserRole } from "@/app/dashboard/task-actions";
import type { RoleName, SessionTokenPayload } from "@/lib/auth/types";
import type { TeamAccessUser } from "@/lib/auth/users";

const roleOptions = [
  {
    name: "Admin",
    label: "Admin",
    helper: "Full workspace access, role management, and all task controls.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    name: "Manager",
    label: "Manager",
    helper: "Can create, assign, and update work they manage.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    name: "User",
    label: "User",
    helper: "Can view and update assigned task work.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
] as const satisfies ReadonlyArray<{
  name: RoleName;
  label: string;
  helper: string;
  badgeClassName: string;
}>;

interface TeamAccessPanelProps {
  currentUserId: string;
  returnTo: string;
  session: SessionTokenPayload;
  users: TeamAccessUser[];
}

export function TeamAccessPanel({
  currentUserId,
  returnTo,
  session,
  users,
}: TeamAccessPanelProps) {
  const isAdmin = session.roles.includes("Admin");
  const visibleRoleNames = roleOptions.filter((role) =>
    session.roles.includes(role.name)
  );

  if (!isAdmin) {
    return (
      <section className="rounded-lg border border-white/70 bg-white/90 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase text-slate-500">
              Team access
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Your current access
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Ask an Admin if your workspace access needs to change.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleRoleNames.map((role) => (
              <div
                key={role.name}
                className={`rounded-lg border px-4 py-3 ${role.badgeClassName}`}
              >
                <p className="text-sm font-semibold">{role.label}</p>
                <p className="mt-1 text-xs leading-5">{role.helper}</p>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              Permissions: {session.permissions.join(", ") || "None"}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/90 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase text-slate-500">
            Team access
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Choose each member&apos;s role
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Role changes take effect on the user&apos;s next sign-in. Current
            selections are shown beside every teammate.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[32rem]">
          {roleOptions.map((role) => (
            <div
              key={role.name}
              className={`rounded-lg border px-4 py-3 ${role.badgeClassName}`}
            >
              <p className="text-sm font-semibold">{role.label}</p>
              <p className="mt-1 text-xs leading-5">{role.helper}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[1.2fr_0.7fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase text-white">
          <span>Person</span>
          <span>Current</span>
          <span>Change role</span>
        </div>

        <div className="divide-y divide-slate-200 bg-white">
          {users.map((user) => {
            const currentRole =
              (user.userRoles[0]?.role.name as RoleName | undefined) ?? "User";
            const roleConfig =
              roleOptions.find((role) => role.name === currentRole) ??
              roleOptions[2];
            const isSelf = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_0.7fr_1fr] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {user.name ?? "Unnamed user"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {user.email}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${roleConfig.badgeClassName}`}
                  >
                    {currentRole}
                  </span>
                </div>

                <form action={updateUserRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <select
                    name="roleName"
                    defaultValue={currentRole}
                    disabled={isSelf}
                    className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSelf}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
