import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { officials, users, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get("organizationId")
    const level = searchParams.get("level")

    try {
        let whereClause: any[] = [eq(officials.isActive, true)]

        if (organizationId) {
            whereClause.push(eq(officials.organizationId, organizationId))
        }
        if (level) {
            whereClause.push(eq(officials.positionLevel, level.toUpperCase() as any))
        }

        const data = await db.select({
            id: officials.id,
            position: officials.position,
            positionLevel: officials.positionLevel,
            termStart: officials.termStart,
            termEnd: officials.termEnd,
            bio: officials.bio,
            image: officials.image,
            userName: users.name,
            orgName: organizations.name,
            orgLevel: organizations.level,
        })
        .from(officials)
        .leftJoin(users, eq(officials.userId, users.id))
        .leftJoin(organizations, eq(officials.organizationId, organizations.id))
        .where(and(...whereClause))
        .orderBy(officials.positionLevel, officials.position)

        return NextResponse.json(data)
    } catch (error) {
        console.error("Public officials fetch error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
