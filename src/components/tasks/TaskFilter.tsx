import type { AssignableUser } from "@/lib/auth/users";
import type { DashboardTaskFilters } from "@/lib/tasks/filters";
import {
  taskPriorityLabels,
  taskPriorityOrder,
  taskStatusLabels,
  taskStatusOrder,
} from "@/lib/tasks/constants";

interface TaskFilterProps {
  filters: DashboardTaskFilters;
  assignableUsers: AssignableUser[];
}

export function TaskFilter({ filters, assignableUsers }: TaskFilterProps) {
  const activeFilterCount = [
    Boolean(filters.q),
    filters.status !== "ALL",
    filters.priority !== "ALL",
    filters.assignee !== "ALL",
  ].filter(Boolean).length;

  return (
    <section className="rounded-lg border border-white/70 bg-white/90 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-slate-500">
            Filters
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Narrow the board
          </h2>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {activeFilterCount === 0
            ? "No active filters"
            : `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}`}
        </div>
      </div>

      <form action="/dashboard" className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="board" value={filters.board} />

        <label className="block space-y-2 text-sm text-slate-700">
          <span>Search</span>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search tasks or people"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </label>

        <label className="block space-y-2 text-sm text-slate-700">
          <span>Status</span>
          <select
            name="status"
            defaultValue={filters.status}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-400 focus:bg-white"
          >
            <option value="ALL">All statuses</option>
            {taskStatusOrder.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm text-slate-700">
          <span>Priority</span>
          <select
            name="priority"
            defaultValue={filters.priority}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-400 focus:bg-white"
          >
            <option value="ALL">All priorities</option>
            {taskPriorityOrder.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm text-slate-700">
          <span>Assignee</span>
          <select
            name="assignee"
            defaultValue={filters.assignee}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-400 focus:bg-white"
          >
            <option value="ALL">Everyone</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ? `${user.name} (${user.email})` : user.email}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3 md:col-span-2">
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Apply
          </button>
          <a
            href="/dashboard"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset
          </a>
        </div>
      </form>
    </section>
  );
}
