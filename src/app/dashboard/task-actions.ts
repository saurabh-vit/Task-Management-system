"use server";

import type { Route } from "next";
import { AuditActionType, TaskProjectRole } from "@/generated/prisma/enums";
import { buildRedirectUrl, getActionErrorMessage, getTextValue } from "@/lib/action-utils";
import {
  assertAuthorized,
  authorizeRole,
} from "@/lib/auth/authorization";
import { getRequiredSession } from "@/lib/auth/session";
import { getRoleByName, listAssignableUsers } from "@/lib/auth/users";
import { roleNameSchema } from "@/lib/auth/schemas";
import { logAuditEntry } from "@/lib/db/audit";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { prisma } from "@/lib/prisma";
import { canCreateTasks, canDeleteTask, getTaskByIdForSession, readVisibleTasks } from "@/lib/tasks/queries";
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
} from "@/lib/tasks/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function resolveReturnTo(formData: FormData) {
  const returnTo = getTextValue(formData, "returnTo");

  if (!returnTo.startsWith("/dashboard")) {
    return "/dashboard";
  }

  return returnTo;
}

function normalizeAssigneeIds(taskCreatorId: string, assigneeUserId?: string) {
  if (!assigneeUserId || assigneeUserId === taskCreatorId) {
    return [
      {
        userId: taskCreatorId,
        projectRole: TaskProjectRole.OWNER,
      },
    ];
  }

  return [
    {
      userId: taskCreatorId,
      projectRole: TaskProjectRole.OWNER,
    },
    {
      userId: assigneeUserId,
      projectRole: TaskProjectRole.ASSIGNEE,
    },
  ];
}

async function assertAssigneeExists(assigneeUserId?: string) {
  if (!assigneeUserId) {
    return;
  }

  const assignableUsers = await listAssignableUsers();
  const userExists = assignableUsers.some((user) => user.id === assigneeUserId);

  if (!userExists) {
    throw new Error("The selected assignee does not exist.");
  }
}

export async function getTasks() {
  const session = await getRequiredSession();
  return readVisibleTasks(session);
}

export async function createTask(formData: FormData) {
  const session = await getRequiredSession();
  const returnTo = resolveReturnTo(formData);
  let redirectUrl = buildRedirectUrl(
    returnTo,
    "error",
    "Unable to create the task."
  );

  try {
    assertAuthorized(authorizeRole(session, ["Manager"]));

    if (!canCreateTasks(session)) {
      throw new Error("You do not have permission to create tasks.");
    }

    const parsed = createTaskSchema.parse({
      title: getTextValue(formData, "title"),
      description: getTextValue(formData, "description"),
      status: getTextValue(formData, "status") || "TODO",
      priority: getTextValue(formData, "priority") || "MEDIUM",
      dueDate: getTextValue(formData, "dueDate"),
      assigneeUserId: getTextValue(formData, "assigneeUserId"),
    });

    await ensureDatabaseReady();
    await assertAssigneeExists(parsed.assigneeUserId);

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        status: parsed.status,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        createdById: session.sub,
        assignments: {
          create: normalizeAssigneeIds(session.sub, parsed.assigneeUserId),
        },
      },
    });

    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.CREATE,
      resourceType: "Task",
      resourceId: task.id,
      details: {
        title: task.title,
        priority: task.priority,
        status: task.status,
      },
    });

    revalidatePath("/dashboard");
    redirectUrl = buildRedirectUrl(
      returnTo,
      "success",
      "Task created successfully."
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      returnTo,
      "error",
      getActionErrorMessage(error, "Unable to create the task.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function updateTask(formData: FormData) {
  const session = await getRequiredSession();
  const returnTo = resolveReturnTo(formData);
  let redirectUrl = buildRedirectUrl(
    returnTo,
    "error",
    "Unable to update the task."
  );

  try {
    const parsed = updateTaskSchema.parse({
      taskId: getTextValue(formData, "taskId"),
      title: getTextValue(formData, "title"),
      description: getTextValue(formData, "description"),
      status: getTextValue(formData, "status") || "TODO",
      priority: getTextValue(formData, "priority") || "MEDIUM",
      dueDate: getTextValue(formData, "dueDate"),
      assigneeUserId: getTextValue(formData, "assigneeUserId"),
    });

    await ensureDatabaseReady();
    const task = await getTaskByIdForSession(session, parsed.taskId);

    if (session.roles.includes("User") && !session.roles.includes("Manager")) {
      await prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          status: parsed.status,
        },
      });
    } else {
      await assertAssigneeExists(parsed.assigneeUserId);

      await prisma.$transaction(async (transaction) => {
        await transaction.task.update({
          where: {
            id: task.id,
          },
          data: {
            title: parsed.title,
            description: parsed.description,
            status: parsed.status,
            priority: parsed.priority,
            dueDate: parsed.dueDate,
          },
        });

        await transaction.taskAssignment.deleteMany({
          where: {
            taskId: task.id,
          },
        });

        await transaction.taskAssignment.createMany({
          data: normalizeAssigneeIds(task.createdById, parsed.assigneeUserId).map(
            (assignment) => ({
              taskId: task.id,
              userId: assignment.userId,
              projectRole: assignment.projectRole,
            })
          ),
        });
      });
    }

    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.UPDATE,
      resourceType: "Task",
      resourceId: task.id,
      details: {
        status: parsed.status,
        priority: parsed.priority,
        updatedByRole: session.roles[0] ?? "User",
      },
    });

    revalidatePath("/dashboard");
    redirectUrl = buildRedirectUrl(
      returnTo,
      "success",
      "Task updated successfully."
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      returnTo,
      "error",
      getActionErrorMessage(error, "Unable to update the task.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function deleteTask(formData: FormData) {
  const session = await getRequiredSession();
  const returnTo = resolveReturnTo(formData);
  let redirectUrl = buildRedirectUrl(
    returnTo,
    "error",
    "Unable to delete the task."
  );

  try {
    const parsed = deleteTaskSchema.parse({
      taskId: getTextValue(formData, "taskId"),
    });

    await ensureDatabaseReady();
    const task = await getTaskByIdForSession(session, parsed.taskId);

    if (!canDeleteTask(session, task)) {
      throw new Error("Only admins and task creators can delete tasks.");
    }

    await prisma.task.delete({
      where: {
        id: task.id,
      },
    });

    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.DELETE,
      resourceType: "Task",
      resourceId: task.id,
      details: {
        title: task.title,
      },
    });

    revalidatePath("/dashboard");
    redirectUrl = buildRedirectUrl(
      returnTo,
      "success",
      "Task deleted successfully."
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      returnTo,
      "error",
      getActionErrorMessage(error, "Unable to delete the task.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function toggleTaskCompletion(formData: FormData) {
  const session = await getRequiredSession();
  const returnTo = resolveReturnTo(formData);
  let redirectUrl = buildRedirectUrl(
    returnTo,
    "error",
    "Unable to update task completion."
  );

  try {
    const parsed = deleteTaskSchema.extend({
      status: createTaskSchema.shape.status,
    }).parse({
      taskId: getTextValue(formData, "taskId"),
      status: getTextValue(formData, "status") || "TODO",
    });

    await ensureDatabaseReady();
    const task = await getTaskByIdForSession(session, parsed.taskId);

    await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: parsed.status,
      },
    });

    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.UPDATE,
      resourceType: "Task",
      resourceId: task.id,
      details: {
        status: parsed.status,
        quickToggle: true,
      },
    });

    revalidatePath("/dashboard");
    redirectUrl = buildRedirectUrl(
      returnTo,
      "success",
      parsed.status === "DONE"
        ? "Task marked as complete."
        : "Task reopened successfully."
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      returnTo,
      "error",
      getActionErrorMessage(error, "Unable to update task completion.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function updateUserRole(formData: FormData) {
  const session = await getRequiredSession();
  const returnTo = resolveReturnTo(formData);
  let redirectUrl = buildRedirectUrl(
    returnTo,
    "error",
    "Unable to update the user role."
  );

  try {
    assertAuthorized(authorizeRole(session, ["Admin"]));

    const userId = getTextValue(formData, "userId");
    const roleName = roleNameSchema.parse(getTextValue(formData, "roleName"));

    if (!userId) {
      throw new Error("Choose a user before assigning a role.");
    }

    if (userId === session.sub) {
      throw new Error("Ask another admin to change your own role.");
    }

    await ensureDatabaseReady();

    const [targetUser, role] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      getRoleByName(roleName),
    ]);

    if (!targetUser) {
      throw new Error("That user no longer exists.");
    }

    if (!role) {
      throw new Error("The selected role is not configured.");
    }

    const previousRoles = targetUser.userRoles.map(
      (userRole) => userRole.role.name
    );

    await prisma.$transaction(async (transaction) => {
      await transaction.userRole.deleteMany({
        where: {
          userId,
        },
      });

      await transaction.userRole.create({
        data: {
          userId,
          roleId: role.id,
        },
      });
    });

    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.UPDATE,
      resourceType: "UserRole",
      resourceId: userId,
      details: {
        targetEmail: targetUser.email,
        previousRoles,
        assignedRole: roleName,
      },
    });

    revalidatePath("/dashboard");
    redirectUrl = buildRedirectUrl(
      returnTo,
      "success",
      `${targetUser.name ?? targetUser.email} is now ${roleName}.`
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      returnTo,
      "error",
      getActionErrorMessage(error, "Unable to update the user role.")
    );
  }

  redirect(redirectUrl as Route);
}
