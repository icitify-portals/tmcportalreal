import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission, canAccessOrganization } from "@/lib/rbac"
import { db } from "@/lib/db"
import { members, users, organizations, auditLogs } from "@/lib/db/schema"
import { createAuditLog } from "@/lib/audit"
import { generateMemberId } from "@/lib/utils"
import bcrypt from "bcryptjs"
import { eq, and, desc, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    requirePermission(session, "members:read")

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const whereConditions = []

    if (organizationId) {
      if (!canAccessOrganization(session, organizationId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      whereConditions.push(eq(members.organizationId, organizationId))
    } else if (session?.user?.organizationId) {
      whereConditions.push(eq(members.organizationId, session.user.organizationId))
    }

    if (status) {
      whereConditions.push(eq(members.status, status as any))
    }

    const [data, totalResult] = await Promise.all([
      db.query.members.findMany({
        where: and(...whereConditions),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          organization: {
            columns: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(members.createdAt)],
      }),
      db.select({ count: count() }).from(members).where(and(...whereConditions)),
    ])

    return NextResponse.json({
      members: data,
      pagination: {
        page,
        limit,
        total: totalResult[0].count,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    requirePermission(session, "members:create")

    const body = await request.json()
    const {
      email,
      password,
      name,
      phone,
      organizationId,
      membershipType,
      dateOfBirth,
      gender,
      occupation,
      address,
    } = body

    // Check organization access
    const orgId = organizationId || session?.user?.organizationId
    if (!orgId || !canAccessOrganization(session, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Get organization to generate member ID
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Generate member ID
    const memberCountResult = await db.select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId))

    const memberCount = memberCountResult[0].count
    const memberId = generateMemberId(organization.code, memberCount + 1)

    // Create user and member
    // Drizzle doesn't support nested creates in one go easily (like Prisma include/create)
    // We transactionally create user then member

    let resultUser
    let resultMember: any

    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        email,
        password: hashedPassword,
        name,
        phone,
      })
      // Note: id is generated in DB/schema default, but we might need to fetch it if MySql doesn't return it
      // Actually Drizzle with MySQL2 driver insert result returning ID?
      // If we use $defaultFn in schema, we can generate ID here if we want or fetch it.
      // Easiest is to generate ID client side if schema supports it or fetch the user.
      // But we set $defaultFn in schema using crypto.randomUUID().
      // For MySql insert returning ID is tricky for UUIDs if not auto_increment.
      // Better to generate ID here or rely on Drizzle's $defaultFn working and fetch the user?
      // Actually schema defines `id: varchar("id").$defaultFn(() => crypto.randomUUID())`
      // So Drizzle generates it BEFORE insert?
      // Yes, if we don't pass it. But we can't easily get it back from MySQL insert result usually unless we query.
      // Let's generate it explicitly here to be safe and have the ID.

      const userId = crypto.randomUUID()
      await tx.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        name,
        phone,
      })

      const newMemberId = crypto.randomUUID()
      await tx.insert(members).values({
        id: newMemberId,
        userId: userId,
        organizationId: orgId,
        memberId,
        membershipType: membershipType || "REGULAR",
        status: "PENDING",
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        occupation,
        address,
      })

      // Fetch back for return
      resultMember = await tx.query.members.findFirst({
        where: eq(members.id, newMemberId),
        with: { user: true, organization: true }
      })
    })

    await createAuditLog({
      userId: session?.user?.id,
      action: "CREATE_MEMBER",
      entityType: "Member",
      entityId: resultMember?.id,
      organizationId: orgId,
      description: `Created member ${memberId}`,
    })

    return NextResponse.json({ member: resultMember }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

