"use server";

import type { Route } from "next";
import { AuditActionType } from "@/generated/prisma/enums";
import { buildRedirectUrl, getActionErrorMessage, getTextValue } from "@/lib/action-utils";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import {
  buildSessionPayload,
  countUsers,
  findUserByEmail,
  findUserById,
  getRoleByName,
  normalizeEmail,
} from "@/lib/auth/users";
import { logAuditEntry } from "@/lib/db/audit";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function resolveNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function loginUser(formData: FormData) {
  let redirectUrl = buildRedirectUrl("/login", "error", "Unable to sign in.");

  try {
    await ensureDatabaseReady();

    const parsed = loginSchema.parse({
      email: getTextValue(formData, "email"),
      password: getTextValue(formData, "password"),
      next: getTextValue(formData, "next"),
    });

    const user = await findUserByEmail(parsed.email);

    if (!user) {
      throw new Error("No account was found for that email address.");
    }

    const passwordMatches = await verifyPassword(parsed.password, user.passwordHash);

    if (!passwordMatches) {
      throw new Error("Incorrect password.");
    }

    await setSessionCookie(buildSessionPayload(user));

    await logAuditEntry({
      userId: user.id,
      actionType: AuditActionType.LOGIN,
      resourceType: "Session",
      resourceId: user.id,
      details: {
        email: user.email,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");

    redirectUrl = buildRedirectUrl(
      resolveNextPath(parsed.next),
      "success",
      `Welcome back${user.name ? `, ${user.name}` : ""}.`
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      "/login",
      "error",
      getActionErrorMessage(error, "Unable to sign in.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function registerUser(formData: FormData) {
  let redirectUrl = buildRedirectUrl("/register", "error", "Unable to create your account.");

  try {
    await ensureDatabaseReady();

    const parsed = registerSchema.parse({
      name: getTextValue(formData, "name"),
      email: getTextValue(formData, "email"),
      password: getTextValue(formData, "password"),
      confirmPassword: getTextValue(formData, "confirmPassword"),
      next: getTextValue(formData, "next"),
    });

    const email = normalizeEmail(parsed.email);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw new Error("An account with that email already exists.");
    }

    const totalUsers = await countUsers();
    const roleName = totalUsers === 0 ? "Admin" : "User";
    const role = await getRoleByName(roleName);

    if (!role) {
      throw new Error("The base role configuration is missing.");
    }

    const passwordHash = await hashPassword(parsed.password);

    const createdUser = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: parsed.name,
          email,
          passwordHash,
        },
      });

      await transaction.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return user;
    });

    const userWithAccess = await findUserById(createdUser.id);

    if (!userWithAccess) {
      throw new Error("Your account was created, but the session could not be prepared.");
    }

    await setSessionCookie(buildSessionPayload(userWithAccess));

    await logAuditEntry({
      userId: createdUser.id,
      actionType: AuditActionType.CREATE,
      resourceType: "User",
      resourceId: createdUser.id,
      details: {
        email,
        assignedRole: roleName,
      },
    });

    await logAuditEntry({
      userId: createdUser.id,
      actionType: AuditActionType.LOGIN,
      resourceType: "Session",
      resourceId: createdUser.id,
      details: {
        email,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");

    redirectUrl = buildRedirectUrl(
      resolveNextPath(parsed.next),
      "success",
      totalUsers === 0
        ? "Admin account created. You are ready to start managing tasks."
        : "Account created successfully."
    );
  } catch (error) {
    redirectUrl = buildRedirectUrl(
      "/register",
      "error",
      getActionErrorMessage(error, "Unable to create your account.")
    );
  }

  redirect(redirectUrl as Route);
}

export async function logoutUser() {
  const session = await getSession();

  if (session) {
    await logAuditEntry({
      userId: session.sub,
      actionType: AuditActionType.LOGOUT,
      resourceType: "Session",
      resourceId: session.sub,
      details: {
        email: session.email,
      },
    });
  }

  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect(
    buildRedirectUrl("/login", "success", "You have been signed out.") as Route
  );
}
