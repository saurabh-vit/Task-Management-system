import { z } from "zod";

const optionalStringSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined);

const optionalDateSchema = z.string().trim().transform((value, ctx) => {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter a valid due date.",
    });

    return z.NEVER;
  }

  return parsedDate;
});

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(120, "Task title must be 120 characters or fewer."),
  description: optionalStringSchema,
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: optionalDateSchema,
  assigneeUserId: optionalStringSchema,
});

export const updateTaskSchema = createTaskSchema.extend({
  taskId: z.string().trim().min(1, "Task id is required."),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Task id is required."),
});
