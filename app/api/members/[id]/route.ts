import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac"
import { db } from "@/lib/db"
import { members, payments, documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "members:read")

    const member = await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        organization: true,
        payments: {
          orderBy: [desc(payments.createdAt)],
          limit: 10,
        },
        documents: {
          orderBy: [desc(documents.createdAt)],
          limit: 10,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ member })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession()
    requirePermission(session, "members:update")

    const body = await request.json()
    const { status, membershipType, ...memberData } = body

    await db.update(members)
      .set({
        ...memberData,
        status: status || undefined,
        membershipType: membershipType || undefined,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))

    const member = await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        user: true,
        organization: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found after update" }, { status: 404 })
    }

    await createAuditLog({
      userId: session?.user?.id,
      action: "UPDATE_MEMBER",
      entityType: "Member",
      entityId: member.id,
      organizationId: member.organizationId,
      description: `Updated member ${member.memberId}`,
    })

    return NextResponse.json({ member })
  } catch (error: any) {
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
    requirePermission(session, "members:delete")

    const member = await db.query.members.findFirst({
      where: eq(members.id, id),
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    await db.delete(members).where(eq(members.id, id))

    await createAuditLog({
      userId: session?.user?.id,
      action: "DELETE_MEMBER",
      entityType: "Member",
      entityId: id,
      organizationId: member.organizationId,
      description: `Deleted member ${member.memberId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

