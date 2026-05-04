import "server-only";

import { AuditActionType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import {
  assertAuthorized,
  authorizeTaskAccess,
} from "@/lib/auth/authorization";
import type { SessionTokenPayload } from "@/lib/auth/types";
import { logAuditEntry } from "@/lib/db/audit";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { prisma } from "@/lib/prisma";

const taskInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignments: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      assignedAt: "asc",
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export function canCreateTasks(session: SessionTokenPayload) {
  return (
    session.roles.includes("Admin") ||
    session.roles.includes("Manager") ||
    session.permissions.includes("task:create")
  );
}

export function canDeleteTask(
  session: SessionTokenPayload,
  task: Pick<TaskWithRelations, "createdById">
) {
  if (session.roles.includes("Admin")) {
    return true;
  }

  return session.roles.includes("Manager") && task.createdById === session.sub;
}

export function getVisibleTaskWhere(
  session: SessionTokenPayload
): Prisma.TaskWhereInput {
  if (session.roles.includes("Admin")) {
    return {};
  }

  if (session.roles.includes("Manager")) {
    return {
      OR: [
        {
          createdById: session.sub,
        },
        {
          assignments: {
            some: {
              userId: session.sub,
            },
          },
        },
      ],
    };
  }

  return {
    assignments: {
      some: {
        userId: session.sub,
      },
    },
  };
}

export async function getTaskByIdForSession(
  session: SessionTokenPayload,
  taskId: string
) {
  await ensureDatabaseReady();

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: taskInclude,
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  assertAuthorized(
    authorizeTaskAccess(session, {
      creatorUserId: task.createdById,
      assigneeUserIds: task.assignments.map((assignment) => assignment.userId),
    })
  );

  return task;
}

export async function readVisibleTasks(session: SessionTokenPayload) {
  await ensureDatabaseReady();

  const tasks = await prisma.task.findMany({
    where: getVisibleTaskWhere(session),
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });

  await logAuditEntry({
    userId: session.sub,
    actionType: AuditActionType.READ,
    resourceType: "TaskCollection",
    resourceId: "visible-tasks",
    details: {
      visibleTaskCount: tasks.length,
    },
  });

  return tasks;
}
