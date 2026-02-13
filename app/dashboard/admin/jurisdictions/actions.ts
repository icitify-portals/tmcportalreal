"use server"

import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"


// Define schema locally for now or import if I standardize it later
const createJurisdictionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
    level: z.enum(["STATE", "LOCAL_GOVERNMENT", "BRANCH"]),
    parentId: z.string().optional(),
})

export async function getJurisdictions(level: "STATE" | "LOCAL_GOVERNMENT" | "BRANCH") {
    const session = await getServerSession()
    requirePermission(session, "organizations:read")

    const data = await db.query.organizations.findMany({
        where: eq(organizations.level, level),
        with: {
            parent: {
                columns: {
                    name: true,
                    code: true,
                },
            },
        },
        orderBy: [desc(organizations.createdAt)],
    })

    return { success: true, data }
}

export async function createJurisdiction(formData: z.infer<typeof createJurisdictionSchema>) {
    const session = await getServerSession()
    requirePermission(session, "organizations:create")

    const validated = createJurisdictionSchema.safeParse(formData)

    if (!validated.success) {
        return { success: false, error: "Invalid data", details: validated.error.flatten() }
    }

    const { name, code, level, parentId } = validated.data

    try {
        // Check for duplicate code
        const existing = await db.query.organizations.findFirst({
            where: eq(organizations.code, code)
        })

        if (existing) {
            return { success: false, error: "An organization with this code already exists" }
        }

        await db.insert(organizations).values({
            name,
            code,
            level,
            parentId: parentId || null,
            country: "Nigeria", // Default
        })

        revalidatePath("/dashboard/admin/jurisdictions")
        return { success: true, message: "Jurisdiction created successfully" }
    } catch (error) {
        console.error("Failed to create jurisdiction:", error)
        return { success: false, error: "Failed to create jurisdiction" }
    }
}

export async function deleteJurisdiction(id: string) {
    const session = await getServerSession()
    requirePermission(session, "organizations:delete")

    try {
        // Check for children
        const children = await db.query.organizations.findFirst({
            where: eq(organizations.parentId, id),
        })

        if (children) {
            return { success: false, error: "Cannot delete jurisdiction with sub-jurisdictions. Delete them first." }
        }

        await db.delete(organizations).where(eq(organizations.id, id))

        revalidatePath("/dashboard/admin/jurisdictions")
        return { success: true, message: "Jurisdiction deleted successfully" }
    } catch (error) {
        console.error("Failed to delete jurisdiction:", error)
        return { success: false, error: "Failed to delete jurisdiction" }
    }
}

// Helper to get potential parents (e.g., get all States when creating an LGA)
export async function getPotentialParents(level: "STATE" | "LOCAL_GOVERNMENT") {
    const session = await getServerSession()
    requirePermission(session, "organizations:read")

    const data = await db.query.organizations.findMany({
        where: eq(organizations.level, level),
        columns: {
            id: true,
            name: true,
            code: true
        },
        orderBy: [desc(organizations.name)]
    })

    return { success: true, data }
}
