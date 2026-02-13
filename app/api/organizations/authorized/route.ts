import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq, inArray, or, sql } from "drizzle-orm"

export async function GET() {
    const session = await getServerSession()
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        if (session.user.isSuperAdmin) {
            const allOrgs = await db.query.organizations.findMany({
                columns: { id: true, name: true, level: true }
            })
            return NextResponse.json(allOrgs)
        }

        const userRoles = session.user.roles || []
        const managedOrgIds = userRoles
            .filter((r: any) => r.organizationId)
            .map((r: any) => r.organizationId)

        if (managedOrgIds.length === 0) {
            return NextResponse.json([])
        }

        // Fetch the managed orgs AND their descendants
        // Simplified approach: Fetch managed orgs first
        const managedOrgs = await db.query.organizations.findMany({
            where: inArray(organizations.id, managedOrgIds as string[]),
            columns: { id: true, name: true, level: true }
        })

        // For now, let's fetch immediate children as well if needed. 
        // In a complex hierarchy, we'd want a recursive fetch.
        // For this portal, usually it's State -> LGA -> Branch.

        // Fetch children
        const children = await db.query.organizations.findMany({
            where: inArray(organizations.parentId, managedOrgIds as string[]),
            columns: { id: true, name: true, level: true }
        })

        // Fetch grandchildren (LGA -> Branch)
        const grandChildIds = children.map(c => c.id)
        let grandChildren: any[] = []
        if (grandChildIds.length > 0) {
            grandChildren = await db.query.organizations.findMany({
                where: inArray(organizations.parentId, grandChildIds),
                columns: { id: true, name: true, level: true }
            })
        }

        const result = [...managedOrgs, ...children, ...grandChildren]
        // Deduplicate
        const uniqueResult = Array.from(new Map(result.map(item => [item.id, item])).values())

        return NextResponse.json(uniqueResult)
    } catch (error) {
        console.error("Authorized orgs error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
