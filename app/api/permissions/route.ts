import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { permissions } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    requirePermission(session, "roles:read")

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")

    const whereClause = category ? eq(permissions.category, category) : undefined

    const perms = await db.query.permissions.findMany({
      where: whereClause,
      orderBy: [asc(permissions.category), asc(permissions.name)],
    })

    // Group by category
    const grouped = perms.reduce((acc: Record<string, any[]>, perm: any) => {
      const cat = perm.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(perm)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      permissions: perms,
      grouped,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

