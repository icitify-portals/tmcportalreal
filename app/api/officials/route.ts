import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
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

        // Multi-step transaction or sequential operations
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
        })

        // 2. Auto-Assign Role based on Position
        const roleMapping: Record<string, string[]> = {
            "Amir": ["ORG_ADMIN"],
            "President": ["ORG_ADMIN"],
            "Secretary": ["ORG_ADMIN", "SECRETARY"], // Assuming SECRETARY role exists or just ADMIN
            "General Secretary": ["ORG_ADMIN"],
            "Treasurer": ["FINANCE_ADMIN"],
            "Financial Secretary": ["FINANCE_ADMIN"],
            "ICT Officer": ["ICT_OFFICER"],
            "Publicity Secretary": ["CONTENT_MANAGER"]
        }

        // Normalize position to find matches (simple partial match or exact)
        // For now, let's use the exact keys or checking if the position string contains key words
        let targetRoleCodes: string[] = []

        Object.keys(roleMapping).forEach(key => {
            if (position.toLowerCase().includes(key.toLowerCase())) {
                targetRoleCodes.push(...roleMapping[key])
            }
        })

        // If no specific match, maybe assign a base "OFFICIAL" role if it exists? 
        // For now, only assign privileges if matched high-level roles.

        if (targetRoleCodes.length > 0) {
            // Find these roles in DB
            const rolesToAssign = await db.query.roles.findMany({
                where: (roles, { inArray }) => inArray(roles.code, targetRoleCodes)
            })

            for (const role of rolesToAssign) {
                // Check if user already has this role for this org
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
                        isActive: true
                    })
                }
            }
        }

        return NextResponse.json({ message: "Official added and roles assigned successfully", official: newOfficial })
    } catch (error) {
        console.error("Official creation error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
