import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { roles, rolePermissions } from "@/lib/db/schema"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import { eq, asc, count } from "drizzle-orm"

const createRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).regex(/^[A-Z_]+$/),
  description: z.string().optional(),
  jurisdictionLevel: z.enum(["SYSTEM", "NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH"]),
  permissionIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:read")

    const rolesData = await db.query.roles.findMany({
      where: eq(roles.isActive, true),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        // Count userRoles strategy: Drizzle doesn't support nested _count easily yet 
        // We can do it separate or simpler. For now omitting or adding later.
        userRoles: true // Fetching them to count in app logic or optimizing later
      },
      orderBy: [asc(roles.name)],
    })

    // Map to include count manually if needed or update query to aggregation
    const result = rolesData.map(r => ({
      ...r,
      _count: {
        userRoles: r.userRoles.length
      }
    }))

    return NextResponse.json({ roles: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:create")

    const body = await request.json()
    const data = createRoleSchema.parse(body)

    // Check if code already exists
    const existing = await db.query.roles.findFirst({
      where: eq(roles.code, data.code),
    })

    if (existing) {
      return NextResponse.json({ error: "Role code already exists" }, { status: 400 })
    }

    // Create role
    const roleId = crypto.randomUUID()

    let resultRole;

    await db.transaction(async (tx) => {
      await tx.insert(roles).values({
        id: roleId,
        name: data.name,
        code: data.code,
        description: data.description,
        jurisdictionLevel: data.jurisdictionLevel as any,
      })

      if (data.permissionIds && data.permissionIds.length > 0) {
        const permsToInsert = data.permissionIds.map(permId => ({
          roleId: roleId,
          permissionId: permId,
          granted: true,
          grantedBy: session?.user?.id,
        }))
        await tx.insert(rolePermissions).values(permsToInsert)
      }

      resultRole = await tx.query.roles.findFirst({
        where: eq(roles.id, roleId),
        with: {
          rolePermissions: {
            with: { permission: true }
          }
        }
      })
    })

    await createAuditLog({
      userId: session?.user?.id,
      action: "CREATE_ROLE",
      entityType: "Role",
      entityId: roleId,
      description: `Created role ${data.name}`,
    })

    return NextResponse.json({ role: resultRole }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

