import type { TaskWithRelations } from "@/lib/tasks/queries";
import type { AssignableUser } from "@/lib/auth/users";
import {
  formatTaskDate,
  getPrimaryAssigneeId,
  taskPriorityLabels,
  taskPriorityOrder,
  taskStatusLabels,
  taskStatusOrder,
} from "@/lib/tasks/constants";

interface TaskFormProps {
  action: (formData: FormData) => Promise<void>;
  assignableUsers: AssignableUser[];
  currentUserId: string;
  mode: "create" | "edit";
  returnTo: string;
  task?: TaskWithRelations;
  submitLabel: string;
  compact?: boolean;
}

export function TaskForm({
  action,
  assignableUsers,
  currentUserId,
  mode,
  returnTo,
  task,
  submitLabel,
  compact = false,
}: TaskFormProps) {
  const primaryAssigneeId = task ? getPrimaryAssigneeId(task) : currentUserId;
  const shellClassName = compact ? "space-y-4" : "grid gap-3 md:grid-cols-2";
  const controlClassName =
    compact
      ? "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
      : "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-emerald-400";

  return (
    <form action={action} className={shellClassName}>
      {mode === "edit" && task ? (
        <input type="hidden" name="taskId" value={task.id} />
      ) : null}
      <input type="hidden" name="returnTo" value={returnTo} />

      <label className={`block space-y-2 text-sm text-slate-700 ${compact ? "" : "md:col-span-2"}`}>
        <span>Title</span>
        <input
          name="title"
          required
          defaultValue={task?.title ?? ""}
          className={controlClassName}
          placeholder="Prepare sprint review"
        />
      </label>

      <label className={`block space-y-2 text-sm text-slate-700 ${compact ? "" : "md:col-span-2"}`}>
        <span>Description</span>
        <textarea
          name="description"
          rows={compact ? 3 : 2}
          defaultValue={task?.description ?? ""}
          className={controlClassName}
          placeholder="Add context, blockers, or handoff notes."
        />
      </label>

      <label className="block space-y-2 text-sm text-slate-700">
        <span>Status</span>
        <select
          name="status"
          defaultValue={task?.status ?? "TODO"}
          className={controlClassName}
        >
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
          defaultValue={task?.priority ?? "MEDIUM"}
          className={controlClassName}
        >
          {taskPriorityOrder.map((priority) => (
            <option key={priority} value={priority}>
              {taskPriorityLabels[priority]}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 text-sm text-slate-700">
        <span>Due date</span>
        <input
          name="dueDate"
          type="date"
          defaultValue={task ? formatTaskDate(task.dueDate) : ""}
          className={controlClassName}
        />
      </label>

      <label className="block space-y-2 text-sm text-slate-700">
        <span>Primary assignee</span>
        <select
          name="assigneeUserId"
          defaultValue={primaryAssigneeId}
          className={controlClassName}
        >
          {assignableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ? `${user.name} (${user.email})` : user.email}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className={`w-full rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 ${compact ? "py-3" : "py-2.5 md:col-span-2"}`}
      >
        {submitLabel}
      </button>
    </form>
  );
}
