import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { officials, userRoles, roles } from "@/lib/db/schema"

export async function POST(req: Request) {
    const session = await getServerSession()
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // RBAC Check - Admin or ICT Officer
    const isAuthorized = session.user.isSuperAdmin ||
        session.user.roles?.some((r: any) =>
            r.jurisdictionLevel === "SYSTEM" ||
            r.code?.includes("ADMIN") ||
            r.code?.includes("ICT_OFFICER")
        )

    if (!isAuthorized) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { userId, organizationId, position, positionLevel, termStart, termEnd, bio, image } = body

        if (!userId || !organizationId || !position || !positionLevel || !termStart) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // Check if user is already an official (since userId is UNIQUE in schema)
        const existingOfficial = await db.query.officials.findFirst({
            where: eq(officials.userId, userId)
        })

        if (existingOfficial) {
            return NextResponse.json({ 
                message: "This member is already recorded as an official. Each member can currently only hold one official profile." 
            }, { status: 400 })
        }

        const now = new Date()

        // 1. Add Official
        const newOfficial = await db.insert(officials).values({
            userId,
            organizationId,
            position,
            positionLevel,
            termStart: new Date(termStart),
            termEnd: termEnd ? new Date(termEnd) : null,
            image,
            bio,
            isActive: true,
            createdAt: now,
            updatedAt: now
        })

        // 2. Auto-Assign Role based on Position
        const roleMapping: Record<string, string[]> = {
            "Amir": ["ORG_ADMIN"],
            "President": ["ORG_ADMIN"],
            "Secretary": ["ORG_ADMIN", "SECRETARY"],
            "General Secretary": ["ORG_ADMIN"],
            "Treasurer": ["FINANCE_ADMIN"],
            "Financial Secretary": ["FINANCE_ADMIN"],
            "ICT Officer": ["ICT_OFFICER"],
            "Publicity Secretary": ["CONTENT_MANAGER"]
        }

        let targetRoleCodes: string[] = []
        Object.keys(roleMapping).forEach(key => {
            if (position.toLowerCase().includes(key.toLowerCase())) {
                targetRoleCodes.push(...roleMapping[key])
            }
        })

        if (targetRoleCodes.length > 0) {
            const rolesToAssign = await db.query.roles.findMany({
                where: (roles, { inArray }) => inArray(roles.code, targetRoleCodes)
            })

            for (const role of rolesToAssign) {
                const existing = await db.query.userRoles.findFirst({
                    where: (ur, { and, eq }) => and(
                        eq(ur.userId, userId),
                        eq(ur.roleId, role.id),
                        eq(ur.organizationId, organizationId)
                    )
                })

                if (!existing) {
                    await db.insert(userRoles).values({
                        userId,
                        roleId: role.id,
                        organizationId,
                        assignedBy: session.user.id,
                        assignedAt: now,
                        isActive: true
                    })
                }
            }
        }

        return NextResponse.json({ 
            message: "Official added and roles assigned successfully", 
            official: newOfficial 
        })
    } catch (error: any) {
        console.error("Official creation error:", error)
        // Check for specific DB errors if possible
        const errorMessage = error.message || "Unknown error"
        return NextResponse.json({ 
            message: `Internal Server Error: ${errorMessage}`,
            error: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 })
    }
}
