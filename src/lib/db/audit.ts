import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AuditActionType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

interface LogAuditEntryInput {
  userId: string;
  actionType: AuditActionType;
  resourceType: string;
  resourceId: string;
  details?: Prisma.InputJsonValue;
}

export async function logAuditEntry({
  userId,
  actionType,
  resourceType,
  resourceId,
  details,
}: LogAuditEntryInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        actionType,
        resourceType,
        resourceId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log.", error);
  }
}
