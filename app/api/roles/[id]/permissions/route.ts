import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { roles, rolePermissions, permissions } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import crypto from 'crypto'

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:read")

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      with: {
        rolePermissions: {
          with: {
            permission: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        granted: rp.granted,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "permissions:manage")

    const body = await request.json()
    const { permissionIds } = updatePermissionsSchema.parse(body)

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Get all existing permissions
    const existing = await db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, id)
    })

    const existingIds = new Set(existing.map((ep) => ep.permissionId))
    const newIds = new Set(permissionIds)

    // Permissions to add
    const toAdd = permissionIds.filter((pid) => !existingIds.has(pid))
    // Permissions to remove
    const toRemove = existing
      .filter((ep) => !newIds.has(ep.permissionId))
      .map((ep) => ep.id)

    // Update in transaction
    await db.transaction(async (tx) => {
      if (toRemove.length > 0) {
        await tx.delete(rolePermissions).where(inArray(rolePermissions.id, toRemove))
      }

      if (toAdd.length > 0) {
        await tx.insert(rolePermissions).values(
          toAdd.map(permId => ({
            roleId: id,
            permissionId: permId,
            granted: true,
            grantedBy: session?.user?.id,
          }))
        )
      }
    })

    await createAuditLog({
      userId: session?.user?.id,
      action: "UPDATE_ROLE_PERMISSIONS",
      entityType: "Role",
      entityId: id,
      description: `Updated permissions for role ${role.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Explicitly cast to any to avoid TS issues with Zod types
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

