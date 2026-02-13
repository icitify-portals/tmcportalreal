import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations, userRoles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateCmsSchema = z.object({
    welcomeMessage: z.string().optional(),
    welcomeImageUrl: z.string().optional(),
    googleMapUrl: z.string().optional(),
    socialLinks: z.any().optional(), // Flexible JSON
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
})

export async function GET(request: NextRequest) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Logic to find which organization the user manages
    // For now, let's assume Super Admin or they manage the org attached to their "CMS" role.
    // Or we strictly use the orgId from query param if they manage multiple?
    // Let's first try to find the organization they are an ADMIN/ICT for.

    // Simplification: Fetch the first org they have a role in (or handle multiple later).
    // Or, for National Super Admin, they manage National.

    // Let's get the organization ID from searchParams if provided, else try to find one.
    const searchParams = request.nextUrl.searchParams
    let orgId = searchParams.get("orgId")

    if (!orgId) {
        // Find first active role's org
        const userRole = await db.query.userRoles.findFirst({
            where: and(eq(userRoles.userId, session.user.id), eq(userRoles.isActive, true)),
            with: {
                organization: true
            }
        })

        if (userRole?.organizationId) {
            orgId = userRole.organizationId
        } else {
            // If SuperAdmin but no specific org role attached (unlikely in future, but possible now),
            // maybe return National?
            // For now, return error if no org found.
            return NextResponse.json({ error: "No organization found for user" }, { status: 404 })
        }
    }

    // Verify permission to edit THIS org (TODO: strict RBAC check)

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    })

    if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization: org })
}


export async function PATCH(request: NextRequest) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, ...data } = body // ID expected in body for safety check or context

        // Validate Schema
        const validated = updateCmsSchema.parse(data)

        // TODO: Strict Permission Check (cms:update)

        await db.update(organizations)
            .set(validated)
            .where(eq(organizations.id, id))

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
