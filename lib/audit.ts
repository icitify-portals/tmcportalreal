import { db } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"
import { desc, eq, and, gte, lte } from "drizzle-orm"

export interface AuditLogData {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  organizationId?: string
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      organizationId: data.organizationId,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata || {},
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break the app
    console.error("Failed to create audit log:", error)
  }
}

export async function getAuditLogs(filters: {
  userId?: string
  organizationId?: string
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const whereConditions = []

  if (filters.userId) whereConditions.push(eq(auditLogs.userId, filters.userId))
  if (filters.organizationId) whereConditions.push(eq(auditLogs.organizationId, filters.organizationId))
  if (filters.entityType) whereConditions.push(eq(auditLogs.entityType, filters.entityType))
  if (filters.entityId) whereConditions.push(eq(auditLogs.entityId, filters.entityId))

  if (filters.startDate) whereConditions.push(gte(auditLogs.createdAt, filters.startDate))
  if (filters.endDate) whereConditions.push(lte(auditLogs.createdAt, filters.endDate))

  return db.query.auditLogs.findMany({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [desc(auditLogs.createdAt)],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  })
}


