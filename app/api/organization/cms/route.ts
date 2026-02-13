import { NextRequest, NextResponse } from "next/server" // Fixed import
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations, users, userRoles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

// Helper to get organization ID for the current user
async function getUserOrganization(userId: string) {
    // Try to find an admin role first
    const adminRole = await db.query.userRoles.findFirst({
        where: and(
            eq(userRoles.userId, userId),
            // In a real app, filtering by specific admin roles would be better
            // For now, we assume any role with an organizationId implies some access, 
            // but we should ideally check for "ADMIN" or "ICT_OFFICER" permission.
        ),
        with: {
            role: true
        }
    })

    // If user has a role with an organization, return that org ID
    if (adminRole?.organizationId) {
        return adminRole.organizationId
    }

    // Fallback: Check if they are a member or official (simplified for this context)
    // For CMS, we strictly want someone who has administrative access.
    // Using the session info might be safer if we populated it correctly.

    return null
}

const cmsSchema = z.object({
    welcomeMessage: z.string().optional(),
    welcomeImageUrl: z.string().optional(),
    missionText: z.string().optional(),
    visionText: z.string().optional(),
    whatsapp: z.string().optional(),
    officeHours: z.string().optional(),
    googleMapUrl: z.string().optional(),
    sliderImages: z.any().optional(), // Json
})

export async function GET(req: NextRequest) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryOrgId = searchParams.get("orgId")

    // Determine which organization the user is managing.
    let orgId = queryOrgId || session.user.officialOrganizationId || session.user.memberOrganizationId || session.user.roles?.[0]?.organizationId

    // Super Admin Fallback: If no orgId is found and user is Super Admin, find the National Org
    if (!orgId && session.user.isSuperAdmin) {
        const nationalOrg = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        })
        orgId = nationalOrg?.id || null
    }

    if (!orgId) {
        return NextResponse.json({ error: "No organization associated with this user" }, { status: 404 })
    }

    try {
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
        })

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        return NextResponse.json(org)
    } catch (error) {
        console.error("Failed to fetch CMS content:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryOrgId = searchParams.get("orgId")

    // TODO: Add strict permission check (e.g., must be ADMIN or ICT_OFFICER)
    let orgId = queryOrgId || session.user.officialOrganizationId || session.user.memberOrganizationId || session.user.roles?.[0]?.organizationId

    // Super Admin Fallback
    if (!orgId && session.user.isSuperAdmin) {
        const nationalOrg = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        })
        orgId = nationalOrg?.id || null
    }

    if (!orgId) {
        return NextResponse.json({ error: "No organization associated with this user" }, { status: 403 })
    }

    try {
        const body = await req.json()
        const validData = cmsSchema.parse(body)

        await db.update(organizations)
            .set({
                ...validData,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update CMS content:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
