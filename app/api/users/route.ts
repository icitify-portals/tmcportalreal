import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { db } from "@/lib/db"
import { users, userRoles, roles } from "@/lib/db/schema"
import { ilike, or, eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession()
        requirePermission(session, "users:read")

        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get("q") || ""
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = (page - 1) * limit

        const whereClause = query
            ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))
            : undefined

        // Drizzle query
        const results = await db.query.users.findMany({
            where: whereClause,
            orderBy: [desc(users.createdAt)],
            limit: limit,
            offset: offset,
            with: {
                userRoles: {
                    where: eq(userRoles.isActive, true),
                    with: {
                        role: true
                    }
                }
            },
            columns: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                // Exclude password and sensitive fields by just picking these
            }
        })

        // Separate count query if needed for pagination (optional for basic list)
        // For now, let's just return results. 

        return NextResponse.json({ users: results })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
