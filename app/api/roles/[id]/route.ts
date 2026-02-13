import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { roles, rolePermissions, userRoles } from "@/lib/db/schema"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import { eq, count } from "drizzle-orm"

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).regex(/^[A-Z_]+$/).optional(),
  description: z.string().optional(),
  jurisdictionLevel: z.enum(["SYSTEM", "NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH"]).optional(),
  permissionIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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
            permission: true,
          },
        }
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const userRolesCount = await db.select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, id));

    const roleWithCount = {
      ...role,
      _count: {
        userRoles: userRolesCount[0]?.count ?? 0
      }
    }

    return NextResponse.json({ role: roleWithCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    requirePermission(session, "roles:update")

    const body = await request.json()
    const data = updateRoleSchema.parse(body)

    // Check if role exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Don't allow changing code of System roles if we want to lock them down
    if (existingRole.isSystem && data.code && data.code !== existingRole.code) {
      return NextResponse.json({ error: "Cannot change code of system roles" }, { status: 400 })
    }

    // Don't allow deactivating system roles
    if (existingRole.isSystem && data.isActive === false) {
      return NextResponse.json({ error: "Cannot deactivate system roles" }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      // Update role fields
      // Only update defined fields
      const updates: any = { updatedAt: new Date() }
      if (data.name !== undefined) updates.name = data.name
      if (data.code !== undefined) updates.code = data.code
      if (data.description !== undefined) updates.description = data.description
      if (data.jurisdictionLevel !== undefined) updates.jurisdictionLevel = data.jurisdictionLevel
      if (data.isActive !== undefined) updates.isActive = data.isActive

      await tx.update(roles).set(updates).where(eq(roles.id, id))

      // Update permissions if provided
      // Strategy: Delete all existing for this role, insert new ones. 
      if (data.permissionIds) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id))

        if (data.permissionIds.length > 0) {
          const permsToInsert = data.permissionIds.map(permId => ({
            roleId: id,
            permissionId: permId,
            granted: true,
            grantedBy: session?.user?.id,
          }))
          await tx.insert(rolePermissions).values(permsToInsert)
        }
      }
    })

    await createAuditLog({
      userId: session?.user?.id,
      action: "UPDATE_ROLE",
      entityType: "Role",
      entityId: id,
      description: `Updated role ${existingRole.name}`,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    requirePermission(session, "roles:delete")

    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 })
    }

    // Check assigned users
    const userCountResult = await db.select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, id));

    const userCount = userCountResult[0]?.count ?? 0;

    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. It is assigned to ${userCount} user(s)` },
        { status: 400 }
      )
    }

    await db.delete(roles).where(eq(roles.id, id))

    await createAuditLog({
      userId: session?.user?.id,
      action: "DELETE_ROLE",
      entityType: "Role",
      entityId: id,
      description: `Deleted role ${existingRole.name}`,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
