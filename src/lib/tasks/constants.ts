import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import type { TaskWithRelations } from "@/lib/tasks/queries";

export const taskStatusOrder = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const satisfies readonly TaskStatus[];

export const taskPriorityOrder = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const satisfies readonly TaskPriority[];

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const taskPriorityClasses: Record<TaskPriority, string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-700",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700",
  URGENT: "border-rose-200 bg-rose-50 text-rose-700",
};

export const taskStatusThemes: Record<
  TaskStatus,
  {
    columnBorder: string;
    columnBackground: string;
    accent: string;
  }
> = {
  TODO: {
    columnBorder: "border-slate-200",
    columnBackground: "bg-slate-50/90",
    accent: "text-slate-700",
  },
  IN_PROGRESS: {
    columnBorder: "border-sky-200",
    columnBackground: "bg-sky-50/90",
    accent: "text-sky-700",
  },
  IN_REVIEW: {
    columnBorder: "border-amber-200",
    columnBackground: "bg-amber-50/90",
    accent: "text-amber-700",
  },
  DONE: {
    columnBorder: "border-emerald-200",
    columnBackground: "bg-emerald-50/90",
    accent: "text-emerald-700",
  },
};

export function formatTaskDate(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function formatTaskDateLabel(value: Date | null) {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
}

export function getPrimaryAssigneeId(task: TaskWithRelations) {
  return (
    task.assignments.find((assignment) => assignment.projectRole === "ASSIGNEE")
      ?.userId ??
    task.assignments[0]?.userId ??
    task.createdById
  );
}

export function isTaskCompleted(task: Pick<TaskWithRelations, "status">) {
  return task.status === "DONE";
}
