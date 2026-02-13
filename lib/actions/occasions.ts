"use server"

import { db } from "@/lib/db"
import { occasionTypes, occasionRequests, organizations, users } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"

import { OccasionTypeSchema, RequestSchema } from "@/lib/validators"

// --- Occasion Types ---

export async function createOccasionType(data: z.infer<typeof OccasionTypeSchema>) {
    // Check admin...
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.insert(occasionTypes).values({
        name: data.name,
        certificateFee: data.certificateFee.toString(),
    })
    revalidatePath("/dashboard/admin/occasions")
    return { success: true }
}

export async function getOccasionTypes() {
    return await db.select().from(occasionTypes).where(eq(occasionTypes.isActive, true))
}

export async function getAvailableOrganizations() {
    return await db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(eq(organizations.isActive, true))
}

// --- Requests ---

export async function requestOccasion(data: z.infer<typeof RequestSchema>) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Logic: If certificateNeeded, calculate initial amount (maybe 0 until approved, or set now)
    // For now, let's just save.

    // Get fee if needed
    let amount = "0.00"
    if (data.certificateNeeded) {
        const [type] = await db.select().from(occasionTypes).where(eq(occasionTypes.id, data.typeId))
        if (type && type.certificateFee) amount = type.certificateFee
    }

    const [req] = await db.insert(occasionRequests).values({
        userId: session.user.id,
        typeId: data.typeId,
        organizationId: data.organizationId,
        date: data.date,
        time: data.time,
        venue: data.venue,
        address: data.address,
        role: data.role,
        certificateNeeded: data.certificateNeeded,
        amount: amount,
        details: JSON.stringify(data.details),
        status: 'PENDING'
    }).$returningId()

    revalidatePath("/dashboard/member/occasions")
    return { success: true, requestId: req.id }
}

export async function getAdminRequests(organizationId?: string) {
    const session = await getServerSession()
    // In real app verify admin access

    let query = db.select({
        request: occasionRequests,
        type: occasionTypes,
        user: users
    })
        .from(occasionRequests)
        .leftJoin(occasionTypes, eq(occasionRequests.typeId, occasionTypes.id))
        .leftJoin(users, eq(occasionRequests.userId, users.id))
        .orderBy(desc(occasionRequests.date))
        .$dynamic()

    if (organizationId) {
        query = query.where(eq(occasionRequests.organizationId, organizationId))
    }

    const results = await query

    return results.map(r => ({ ...r.request, type: r.type, user: r.user }))
}

export async function getUserRequests() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    const results = await db.select({
        request: occasionRequests,
        type: occasionTypes,
        org: organizations
    })
        .from(occasionRequests)
        .leftJoin(occasionTypes, eq(occasionRequests.typeId, occasionTypes.id))
        .leftJoin(organizations, eq(occasionRequests.organizationId, organizations.id))
        .where(eq(occasionRequests.userId, session.user.id))
        .orderBy(desc(occasionRequests.createdAt))

    return results.map(r => ({
        ...r.request,
        type: r.type,
        organizationName: r.org?.name
    }))
}

export async function updateRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', certificateNo?: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.update(occasionRequests).set({
        status: status,
        certificateNo: certificateNo // If completed
    }).where(eq(occasionRequests.id, requestId))

    revalidatePath("/dashboard/admin/occasions")
    return { success: true }
}
