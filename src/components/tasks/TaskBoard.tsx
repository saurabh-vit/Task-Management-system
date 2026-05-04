import type { AssignableUser } from "@/lib/auth/users";
import type { SessionTokenPayload } from "@/lib/auth/types";
import type { TaskStatus } from "@/generated/prisma/enums";
import { TaskItem } from "@/components/tasks/TaskItem";
import {
  taskStatusLabels,
  taskStatusOrder,
  taskStatusThemes,
} from "@/lib/tasks/constants";
import { canDeleteTask, type TaskWithRelations } from "@/lib/tasks/queries";

interface TaskBoardProps {
  tasks: TaskWithRelations[];
  assignableUsers: AssignableUser[];
  currentUserId: string;
  returnTo: string;
  selectedStatus: TaskStatus;
  session: SessionTokenPayload;
  onDelete: (formData: FormData) => Promise<void>;
  onQuickToggle: (formData: FormData) => Promise<void>;
  onUpdate: (formData: FormData) => Promise<void>;
}

export function TaskBoard({
  tasks,
  assignableUsers,
  currentUserId,
  returnTo,
  selectedStatus,
  session,
  onDelete,
  onQuickToggle,
  onUpdate,
}: TaskBoardProps) {
  return (
    <section className="space-y-5 rounded-lg border border-white/70 bg-white/90 px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <style>{`
        .board-panel { display: none; }
        #board-TODO:checked ~ .board-panels [data-panel="TODO"],
        #board-IN_PROGRESS:checked ~ .board-panels [data-panel="IN_PROGRESS"],
        #board-IN_REVIEW:checked ~ .board-panels [data-panel="IN_REVIEW"],
        #board-DONE:checked ~ .board-panels [data-panel="DONE"] { display: block; }
        #board-TODO:checked ~ .board-tabs label[for="board-TODO"],
        #board-IN_PROGRESS:checked ~ .board-tabs label[for="board-IN_PROGRESS"],
        #board-IN_REVIEW:checked ~ .board-tabs label[for="board-IN_REVIEW"],
        #board-DONE:checked ~ .board-tabs label[for="board-DONE"] {
          background: white;
          box-shadow: inset 0 0 0 2px rgba(15, 23, 42, 0.12);
        }
      `}</style>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-slate-500">
            Kanban Board
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Move work across stages
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Pick one stage below. The board switches without refreshing the page.
        </p>
      </div>

      {taskStatusOrder.map((status) => (
        <input
          key={status}
          id={`board-${status}`}
          type="radio"
          name="board-stage"
          className="sr-only"
          defaultChecked={status === selectedStatus}
        />
      ))}

      <div className="board-tabs grid gap-3 md:grid-cols-4" aria-label="Kanban stage menu">
        {taskStatusOrder.map((status) => {
          const count = tasks.filter((task) => task.status === status).length;
          const theme = taskStatusThemes[status];

          return (
            <label
              key={status}
              htmlFor={`board-${status}`}
              className={`cursor-pointer rounded-lg border px-4 py-3 transition ${theme.columnBorder} ${theme.columnBackground} hover:bg-white`}
            >
              <span className={`text-sm font-semibold ${theme.accent}`}>
                {taskStatusLabels[status]}
              </span>
              <span className="mt-1 block text-xs uppercase text-slate-500">
                {count} task{count === 1 ? "" : "s"}
              </span>
            </label>
          );
        })}
      </div>

      <div className="board-panels">
        {taskStatusOrder.map((status) => {
          const theme = taskStatusThemes[status];
          const statusTasks = tasks.filter((task) => task.status === status);

          return (
            <section
              key={status}
              data-panel={status}
              className={`board-panel min-h-[18rem] rounded-lg border ${theme.columnBorder} ${theme.columnBackground} px-4 py-4`}
            >
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-white/80 px-4 py-3">
                <div>
                  <p className={`text-sm font-semibold ${theme.accent}`}>
                    {taskStatusLabels[status]}
                  </p>
                  <p className="mt-1 text-xs uppercase text-slate-500">
                    {statusTasks.length} task
                    {statusTasks.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {statusTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm leading-6 text-slate-500 lg:col-span-2 2xl:col-span-3">
                    Nothing here yet. Choose another stage from the menu above.
                  </div>
                ) : (
                  statusTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      assignableUsers={assignableUsers}
                      currentUserId={currentUserId}
                      canManageTask={
                        session.roles.includes("Admin") ||
                        session.roles.includes("Manager")
                      }
                      canDeleteTask={canDeleteTask(session, task)}
                      returnTo={returnTo}
                      onDelete={onDelete}
                      onQuickToggle={onQuickToggle}
                      onUpdate={onUpdate}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
