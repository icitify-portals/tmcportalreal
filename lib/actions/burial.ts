"use server"

import { db } from "@/lib/db"
import { burialRequests, burialCertificates, userRoles, users, payments } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { hasPermission } from "@/lib/rbac-v2"

// Input Validation Schemas
const BurialRequestSchema = z.object({
    deceasedName: z.string().min(1, "Deceased Name is required").max(100),
    relationship: z.string().min(1, "Relationship is required").max(50),
    causeOfDeath: z.string().min(1, "Cause of Death is required").max(255),
    dateOfDeath: z.coerce.date(),
    placeOfDeath: z.string().min(1, "Place of Death is required").max(100),
    contactPhone: z.string().min(10, "Valid phone number is required").max(20),
    contactEmail: z.string().email("Invalid email address"),
})

const StatusUpdateSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED_UNPAID', 'PAID', 'BURIAL_DONE', 'REJECTED']),
    rejectionReason: z.string().optional().nullable()
})

const PaymentVerificationSchema = z.object({
    reference: z.string().min(1)
})

// --- Public / User Actions ---

export async function createBurialRequest(data: z.infer<typeof BurialRequestSchema>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = BurialRequestSchema.safeParse(data)
        if (!validData.success) {
            return { success: false, error: "Invalid data provided" }
        }

        const [request] = await db.insert(burialRequests).values({
            userId: session.user.id,
            ...validData.data,
            status: "PENDING",
        }).$returningId()

        revalidatePath("/dashboard/burial")
        return { success: true, requestId: request.id }
    } catch (error) {
        console.error("Create Burial Request Error:", error)
        return { success: false, error: "Failed to create request" }
    }
}

export async function getUserBurialRequests() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    // Securely fetch only the logged-in user's requests
    const rows = await db.select({
        request: burialRequests,
        payment: payments,
        certificate: burialCertificates
    })
        .from(burialRequests)
        .leftJoin(payments, eq(burialRequests.paymentId, payments.id))
        .leftJoin(burialCertificates, eq(burialRequests.id, burialCertificates.burialRequestId))
        .where(eq(burialRequests.userId, session.user.id))
        .orderBy(desc(burialRequests.createdAt))

    return rows.map(row => ({
        ...row.request,
        payment: row.payment,
        certificate: row.certificate
    }))
}

export async function getBurialRequest(requestId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return null

    const rows = await db.select({
        request: burialRequests,
        user: {
            name: users.name,
            email: users.email,
            image: users.image
        },
        payment: payments,
        certificate: burialCertificates
    })
        .from(burialRequests)
        .leftJoin(users, eq(burialRequests.userId, users.id))
        .leftJoin(payments, eq(burialRequests.paymentId, payments.id))
        .leftJoin(burialCertificates, eq(burialRequests.id, burialCertificates.burialRequestId))
        .where(eq(burialRequests.id, requestId))

    const row = rows[0]
    if (!row) return null

    const result = {
        ...row.request,
        user: row.user,
        payment: row.payment,
        certificate: row.certificate
    }

    // Authorization Check: User owns it OR User is Admin
    const isOwner = result.userId === session.user.id

    if (!isOwner) {
        // Check if user has management permission
        const canView = await hasPermission(session.user.id, 'burials:manage')

        if (!canView) {
            // Fallback: Check if they are at least an official (active role)
            // Re-using the manual join pattern for this check too to be safe/consistent
            const officialRoles = await db.select().from(userRoles)
                .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.isActive, true)))
                .limit(1)

            if (officialRoles.length === 0) return null // Nor owner, nor official
        }
    }

    return result
}

// --- Admin Actions ---

async function verifyAdminAccess(userId: string) {
    // Check if user has management permission
    const hasPerm = await hasPermission(userId, 'burials:manage')
    if (hasPerm) return true

    // Fallback: Check for any active official role (temporary dev fallback logic)
    // Real implementation should rely strictly on permissions
    const roles = await db.select().from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)))
        .limit(1)

    return roles.length > 0
}

export async function getBurialRequests() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    const isAdmin = await verifyAdminAccess(session.user.id)
    if (!isAdmin) return []

    const rows = await db.select({
        request: burialRequests,
        user: {
            name: users.name,
            email: users.email,
            image: users.image
        },
        payment: payments,
        certificate: burialCertificates
    })
        .from(burialRequests)
        .leftJoin(users, eq(burialRequests.userId, users.id))
        .leftJoin(payments, eq(burialRequests.paymentId, payments.id))
        .leftJoin(burialCertificates, eq(burialRequests.id, burialCertificates.burialRequestId))
        .orderBy(desc(burialRequests.createdAt))

    return rows.map(row => ({
        ...row.request,
        user: row.user,
        payment: row.payment,
        certificate: row.certificate
    }))
}


export async function updateBurialRequestStatus(
    requestId: string,
    status: 'PENDING' | 'APPROVED_UNPAID' | 'PAID' | 'BURIAL_DONE' | 'REJECTED',
    rejectionReason?: string
) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        if (!await verifyAdminAccess(session.user.id)) {
            return { success: false, error: "Insufficient permissions" }
        }

        const validStatus = StatusUpdateSchema.safeParse({ status, rejectionReason })
        if (!validStatus.success) return { success: false, error: "Invalid status parameters" }

        await db.update(burialRequests)
            .set({
                status: validStatus.data.status,
                rejectionReason: validStatus.data.rejectionReason || null
            })
            .where(eq(burialRequests.id, requestId))

        revalidatePath(`/dashboard/admin/burials`)
        revalidatePath(`/dashboard/burial`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update status" }
    }
}

export async function generateBurialCertificateRef(requestId: string, adminId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id || session.user.id !== adminId) return { success: false, error: "Unauthorized" }

        if (!await verifyAdminAccess(session.user.id)) return { success: false, error: "Forbidden" }

        const certNumber = `BUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Prevent duplicate certs
        const existing = await db.query.burialCertificates.findFirst({ where: eq(burialCertificates.burialRequestId, requestId) })
        if (existing) return { success: true, certificateNumber: existing.certificateNumber }

        await db.insert(burialCertificates).values({
            burialRequestId: requestId,
            certificateNumber: certNumber,
            issuedBy: adminId,
            issuedAt: new Date(),
        })

        return { success: true, certificateNumber: certNumber }
    } catch (e) {
        return { success: false, error: "Failed to generate certificate record" }
    }
}

export async function markBurialRequestAsPaid(requestId: string, reference: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const isAdmin = await verifyAdminAccess(session.user.id)
        if (!isAdmin) return { success: false, error: "Forbidden" }

        const validRef = PaymentVerificationSchema.safeParse({ reference })
        if (!validRef.success) return { success: false, error: "Invalid reference" }

        await db.update(burialRequests)
            .set({
                status: 'PAID',
                // paymentId: ... would link here in real implementation
            })
            .where(eq(burialRequests.id, requestId))

        revalidatePath(`/dashboard/burial/request/${requestId}`)
        revalidatePath(`/dashboard/admin/burials/request/${requestId}`)
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to update payment status" }
    }
}
