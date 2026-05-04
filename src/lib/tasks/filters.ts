import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import type { TaskWithRelations } from "@/lib/tasks/queries";
import { z } from "zod";

const statusFilterOptions = [
  "ALL",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

const priorityFilterOptions = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export const dashboardFilterSchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value ?? ""),
  status: z.enum(statusFilterOptions).default("ALL"),
  priority: z.enum(priorityFilterOptions).default("ALL"),
  assignee: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || "ALL"),
  board: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
});

export interface DashboardTaskFilters {
  q: string;
  status: "ALL" | TaskStatus;
  priority: "ALL" | TaskPriority;
  assignee: string;
  board: TaskStatus;
}

export function parseDashboardFilters(
  params: Record<string, string | string[] | undefined>
): DashboardTaskFilters {
  return dashboardFilterSchema.parse({
    q: pickFirst(params.q),
    status: pickFirst(params.status) ?? "ALL",
    priority: pickFirst(params.priority) ?? "ALL",
    assignee: pickFirst(params.assignee) ?? "ALL",
    board: pickFirst(params.board) ?? "TODO",
  });
}

export function filterTasksForDashboard(
  tasks: TaskWithRelations[],
  filters: DashboardTaskFilters
) {
  const query = filters.q.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.status !== "ALL" && task.status !== filters.status) {
      return false;
    }

    if (filters.priority !== "ALL" && task.priority !== filters.priority) {
      return false;
    }

    if (
      filters.assignee !== "ALL" &&
      !task.assignments.some((assignment) => assignment.userId === filters.assignee)
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      task.title,
      task.description ?? "",
      task.createdBy.name ?? "",
      task.createdBy.email,
      ...task.assignments.flatMap((assignment) => [
        assignment.user.name ?? "",
        assignment.user.email,
      ]),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function buildDashboardReturnTo(filters: DashboardTaskFilters) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.priority !== "ALL") {
    params.set("priority", filters.priority);
  }

  if (filters.assignee !== "ALL") {
    params.set("assignee", filters.assignee);
  }

  if (filters.board !== "TODO") {
    params.set("board", filters.board);
  }

  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
