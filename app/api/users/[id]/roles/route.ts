import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { users, roles, userRoles, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

const assignRoleSchema = z.object({
  roleId: z.string(),
  organizationId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "users:read")

    const rolesList = await db.query.userRoles.findMany({
      where: and(eq(userRoles.userId, id), eq(userRoles.isActive, true)),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
        organization: true, // Select all organization fields for now
      },
    })

    return NextResponse.json({ userRoles: rolesList })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:assign")

    const body = await request.json()
    const data = assignRoleSchema.parse(body)

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if role exists
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, data.roleId),
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Check if already assigned
    const existing = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, id),
        eq(userRoles.roleId, data.roleId),
        data.organizationId ? eq(userRoles.organizationId, data.organizationId) : undefined
      ),
    })

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await db.update(userRoles)
          .set({
            isActive: true,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          })
          .where(eq(userRoles.id, existing.id));

        const updated = await db.query.userRoles.findFirst({
          where: eq(userRoles.id, existing.id),
          with: { role: true, organization: true }
        });

        await createAuditLog({
          userId: session?.user?.id,
          action: "REACTIVATE_USER_ROLE",
          entityType: "UserRole",
          entityId: existing.id,
          description: `Reactivated role ${role.name} for user`,
        })

        return NextResponse.json({ userRole: updated }, { status: 200 })
      }

      return NextResponse.json(
        { error: "Role already assigned to user" },
        { status: 400 }
      )
    }

    // Assign role
    const newUserRoleId = crypto.randomUUID();
    await db.insert(userRoles).values({
      id: newUserRoleId,
      userId: id,
      roleId: data.roleId,
      organizationId: data.organizationId || null,
      assignedBy: session?.user?.id,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, newUserRoleId),
      with: {
        role: true,
        organization: true,
      },
    });

    await createAuditLog({
      userId: session?.user?.id,
      action: "ASSIGN_ROLE",
      entityType: "UserRole",
      entityId: newUserRoleId,
      description: `Assigned role ${role.name} to user`,
    })

    return NextResponse.json({ userRole }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:assign")

    const searchParams = request.nextUrl.searchParams
    const userRoleId = searchParams.get("userRoleId")

    if (!userRoleId) {
      return NextResponse.json(
        { error: "userRoleId query parameter is required" },
        { status: 400 }
      )
    }

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, userRoleId),
      with: {
        role: true,
        // user: true, // Not strictly needed to check ID matches param
      },
    })

    if (!userRole) {
      return NextResponse.json({ error: "User role not found" }, { status: 404 })
    }

    if (userRole.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Don't delete, just deactivate
    await db.update(userRoles)
      .set({ isActive: false })
      .where(eq(userRoles.id, userRoleId));

    await createAuditLog({
      userId: session?.user?.id,
      action: "REMOVE_USER_ROLE",
      entityType: "UserRole",
      entityId: userRoleId,
      description: `Removed role ${userRole.role.name} from user`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

