import type { AssignableUser } from "@/lib/auth/users";
import type { TaskWithRelations } from "@/lib/tasks/queries";
import { QuickCompleteCheckbox } from "@/components/tasks/QuickCompleteCheckbox";
import { TaskForm } from "@/components/tasks/TaskForm";
import {
  formatTaskDateLabel,
  getPrimaryAssigneeId,
  taskPriorityClasses,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusOrder,
} from "@/lib/tasks/constants";

interface TaskItemProps {
  task: TaskWithRelations;
  assignableUsers: AssignableUser[];
  currentUserId: string;
  canManageTask: boolean;
  canDeleteTask: boolean;
  returnTo: string;
  onDelete: (formData: FormData) => Promise<void>;
  onQuickToggle: (formData: FormData) => Promise<void>;
  onUpdate: (formData: FormData) => Promise<void>;
}

export function TaskItem({
  task,
  assignableUsers,
  currentUserId,
  canManageTask,
  canDeleteTask,
  returnTo,
  onDelete,
  onQuickToggle,
  onUpdate,
}: TaskItemProps) {
  const isDone = task.status === "DONE";
  const primaryAssigneeId = getPrimaryAssigneeId(task);
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toISOString().slice(0, 10)
    : "";
  const assignmentsLabel = task.assignments
    .map((assignment) =>
      `${assignment.user.name ?? assignment.user.email} (${assignment.projectRole})`
    )
    .join(", ");

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${taskPriorityClasses[task.priority]}`}
            >
              {taskPriorityLabels[task.priority]}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {taskStatusLabels[task.status]}
            </span>
          </div>

          {canDeleteTask ? (
            <form action={onDelete}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete
              </button>
            </form>
          ) : null}
        </div>

        <div>
          <h3 className="break-words text-xl font-semibold text-slate-950">
            {task.title}
          </h3>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600">
            {task.description || "No description provided."}
          </p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 text-sm">
        <div className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3">
          <dt className="font-semibold text-slate-950">Due</dt>
          <dd className="min-w-0 break-words text-slate-600">
            {formatTaskDateLabel(task.dueDate)}
          </dd>
        </div>
        <div className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3">
          <dt className="font-semibold text-slate-950">Creator</dt>
          <dd className="min-w-0 break-words text-slate-600">
            {task.createdBy.name ?? task.createdBy.email}
          </dd>
        </div>
        <div className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3">
          <dt className="font-semibold text-slate-950">Assignees</dt>
          <dd className="min-w-0 break-words text-slate-600">
            {assignmentsLabel || "No assignments"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <QuickCompleteCheckbox
          action={onQuickToggle}
          checked={isDone}
          label={isDone ? "Completed" : "Mark complete"}
          taskId={task.id}
          returnTo={returnTo}
        />

        <p className="text-xs uppercase text-slate-500">
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {taskStatusOrder
          .filter((status) => status !== task.status)
          .map((status) => (
            <form key={status} action={onUpdate}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="title" value={task.title} />
              <input
                type="hidden"
                name="description"
                value={task.description ?? ""}
              />
              <input type="hidden" name="priority" value={task.priority} />
              <input type="hidden" name="dueDate" value={dueDate} />
              <input
                type="hidden"
                name="assigneeUserId"
                value={primaryAssigneeId}
              />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Move to {taskStatusLabels[status]}
              </button>
            </form>
          ))}
      </div>

      {canManageTask ? (
        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
            Edit task details
          </summary>
          <div className="mt-4">
            <TaskForm
              action={onUpdate}
              assignableUsers={assignableUsers}
              currentUserId={currentUserId}
              mode="edit"
              returnTo={returnTo}
              task={task}
              submitLabel="Save changes"
              compact
            />
          </div>
        </details>
      ) : (
        <form action={onUpdate} className="mt-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="title" value={task.title} />
          <input type="hidden" name="description" value={task.description ?? ""} />
          <input type="hidden" name="priority" value={task.priority} />
          <input type="hidden" name="dueDate" value={dueDate} />
          <input type="hidden" name="assigneeUserId" value={primaryAssigneeId} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <label className="block space-y-2 text-sm text-slate-700">
            <span>Status</span>
            <select
              name="status"
              defaultValue={task.status}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save status
          </button>
        </form>
      )}
    </article>
  );
}
