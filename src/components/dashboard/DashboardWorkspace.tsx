import { logoutUser } from "@/app/auth-actions";
import {
  createTask,
  deleteTask,
  toggleTaskCompletion,
  updateTask,
} from "@/app/dashboard/task-actions";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFilter } from "@/components/tasks/TaskFilter";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskStats } from "@/components/tasks/TaskStats";
import { TeamAccessPanel } from "@/components/dashboard/TeamAccessPanel";
import { pickSearchParam } from "@/lib/action-utils";
import type { SessionTokenPayload } from "@/lib/auth/types";
import {
  getCurrentUserRecord,
  listAssignableUsers,
  listTeamAccessUsers,
} from "@/lib/auth/users";
import { canCreateTasks, readVisibleTasks } from "@/lib/tasks/queries";
import {
  buildDashboardReturnTo,
  filterTasksForDashboard,
  parseDashboardFilters,
} from "@/lib/tasks/filters";

interface DashboardWorkspaceProps {
  searchParamsPromise?: Promise<Record<string, string | string[] | undefined>>;
  session: SessionTokenPayload;
}

export async function DashboardWorkspace({
  searchParamsPromise,
  session,
}: DashboardWorkspaceProps) {
  const resolvedSearchParams = (await searchParamsPromise) ?? {};
  const error = pickSearchParam(resolvedSearchParams.error);
  const success = pickSearchParam(resolvedSearchParams.success);
  const filters = parseDashboardFilters(resolvedSearchParams);

  const [currentUser, tasks, assignableUsers, teamAccessUsers] = await Promise.all([
    getCurrentUserRecord(session.sub),
    readVisibleTasks(session),
    listAssignableUsers(),
    listTeamAccessUsers(),
  ]);

  if (!currentUser) {
    throw new Error("Your session is no longer valid.");
  }

  const filteredTasks = filterTasksForDashboard(tasks, filters);
  const canCreate = canCreateTasks(session);
  const returnTo = buildDashboardReturnTo(filters);
  const userRoleNames = currentUser.userRoles.map((userRole) => userRole.role.name);

  return (
    <section className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="rounded-lg border border-white/70 bg-white/90 px-8 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {userRoleNames.map((roleName) => (
                <span
                  key={roleName}
                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs uppercase text-emerald-700"
                >
                  {roleName}
                </span>
              ))}
            </div>

            <div>
              <h1 className="text-4xl font-semibold text-slate-950">
                Welcome{currentUser.name ? `, ${currentUser.name}` : ""}.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                Track assigned work, update task status, and keep team progress
                visible from one secure workspace.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
            <p>
              <span className="font-semibold text-slate-950">Email:</span>{" "}
              {currentUser.email}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Permissions:</span>{" "}
              {session.permissions.join(", ")}
            </p>
            <form action={logoutUser} className="mt-4">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      <TaskStats tasks={filteredTasks} />

      <TeamAccessPanel
        currentUserId={currentUser.id}
        returnTo={returnTo}
        session={session}
        users={teamAccessUsers}
      />

      <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <TaskFilter filters={filters} assignableUsers={assignableUsers} />

        {canCreate ? (
          <section className="rounded-lg border border-white/70 bg-white/90 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500">
                    New task
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Create a new task
                  </h2>
                </div>
                <p className="max-w-xs text-sm leading-6 text-slate-500">
                  Add work with status, priority, date, and assignee.
                </p>
              </div>

              <TaskForm
                action={createTask}
                assignableUsers={assignableUsers}
                currentUserId={currentUser.id}
                mode="create"
                returnTo={returnTo}
                submitLabel="Create task"
              />
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-6 text-sm leading-7 text-amber-800">
            You can still work your assigned tasks from the board, but only
            Admins and Managers can create new ones.
          </section>
        )}
      </section>

      <section className="min-w-0">
        <TaskBoard
          tasks={filteredTasks}
          assignableUsers={assignableUsers}
          currentUserId={currentUser.id}
          returnTo={returnTo}
          selectedStatus={filters.board}
          session={session}
          onDelete={deleteTask}
          onQuickToggle={toggleTaskCompletion}
          onUpdate={updateTask}
        />
      </section>
    </section>
  );
}
