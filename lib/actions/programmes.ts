"use server"

import { db } from "@/lib/db"
import {
    programmes, programmeRegistrations, programmeReports,
    programmeStatusEnum, registrationStatusEnum,
    users, organizations, offices
} from "@/lib/db/schema"
import { getYearPlannerSettings } from "@/lib/actions/settings"
import { eq, desc, and, or, aliasedTable, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"

export async function getOffices(organizationId: string) {
    try {
        return await db.select().from(offices).where(eq(offices.organizationId, organizationId))
    } catch (error) {
        return []
    }
}

// Schemas
const ProgrammeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    venue: z.string().min(1, "Venue is required"),
    startDate: z.date(),
    endDate: z.date().optional(),
    time: z.string().optional(),
    targetAudience: z.enum(['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']).default('PUBLIC'),
    paymentRequired: z.boolean().default(false),
    amount: z.number().nonnegative().default(0),
    hasCertificate: z.boolean().default(false),
    organizingOfficeId: z.string().optional(),
})

const ReportSchema = z.object({
    summary: z.string().min(10),
    challenges: z.string().optional(),
    comments: z.string().optional(),
    attendeesMale: z.number().int().nonnegative().default(0),
    attendeesFemale: z.number().int().nonnegative().default(0),
    amountSpent: z.number().nonnegative().default(0),
    images: z.array(z.string().url()).optional(),
})

// --- Programme Management ---

export async function createProgramme(data: z.infer<typeof ProgrammeSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Fetch creator's organization to determine flow
        const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId))
        if (!org) return { success: false, error: "Organization not found" }

        const validData = ProgrammeSchema.parse(data)

        // Flexible Deadline Check: 
        // Retrieve global year planner settings
        const yearSettings = await getYearPlannerSettings()

        const now = new Date()
        const progDate = new Date(validData.startDate)

        // 1. Validate Programme is within current Programme Year
        if (progDate < yearSettings.programYearStart || progDate > yearSettings.programYearEnd) {
            // Optional: Return error or just warn. User asked for "manageable date range". 
            // Let's return error if it's completely outside the active year to enforce discipline.
            return {
                success: false,
                error: `Programme date must be between ${yearSettings.programYearStart.toDateString()} and ${yearSettings.programYearEnd.toDateString()}`
            }
        }

        let isLateSubmission = false

        // 2. Check Deadline
        // If current date is past the submission deadline, mark as late
        if (now > yearSettings.submissionDeadline) {
            isLateSubmission = true
        }

        let initialStatus: 'DRAFT' | 'PENDING_STATE' | 'PENDING_NATIONAL' | 'APPROVED' = 'DRAFT'

        // Workflow Logic:
        // Branch/LGA -> PENDING_STATE (submitted to State for vetting)
        // State -> PENDING_NATIONAL (submitted to National for vetting/approval)
        // National -> APPROVED

        if (org.level === 'BRANCH' || org.level === 'LOCAL_GOVERNMENT') {
            initialStatus = 'PENDING_STATE'
        } else if (org.level === 'STATE') {
            initialStatus = 'PENDING_NATIONAL'
        } else if (org.level === 'NATIONAL') {
            initialStatus = 'APPROVED'
        }

        const [newProgramme] = await db.insert(programmes).values({
            organizationId,
            level: org.level,
            title: validData.title,
            description: validData.description,
            venue: validData.venue,
            startDate: validData.startDate,
            endDate: validData.endDate,
            time: validData.time,
            targetAudience: validData.targetAudience,
            paymentRequired: validData.paymentRequired,
            amount: validData.amount.toString(),
            hasCertificate: validData.hasCertificate,
            organizingOfficeId: validData.organizingOfficeId,
            isLateSubmission,
            status: initialStatus,
            createdBy: session.user.id,
        }).$returningId()

        revalidatePath("/dashboard/admin/programmes")
        return { success: true, programmeId: newProgramme.id }
    } catch (error) {
        console.error("Create Programme Error:", error)
        return { success: false, error: "Failed to create programme" }
    }
}

export async function approveProgrammeState(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Verify approver is State Level (Middleware usually handles this access, but double check org context if passed)

        await db.update(programmes).set({
            status: 'PENDING_NATIONAL', // Promote to next level
            approvedStateBy: session.user.id,
            approvedStateAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

export async function approveProgrammeNational(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmes).set({
            status: 'APPROVED',
            approvedNationalBy: session.user.id,
            approvedNationalAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

// Public/Listing Filter
export async function getProgrammes(filters?: { level?: string, state?: string, status?: string }) {
    // Explicit joins for compatibility query
    const org = aliasedTable(organizations, "org")

    let conditions = [eq(programmes.status, 'APPROVED')] // Default only approved for public

    if (filters?.level) {
        conditions.push(eq(programmes.level as any, filters.level))
    }
    if (filters?.status) {
        // If admin viewing, might not just be approved
        conditions = [eq(programmes.status as any, filters.status)]
    }

    const results = await db.select({
        programme: programmes,
        organization: org
    })
        .from(programmes)
        .leftJoin(org, eq(programmes.organizationId, org.id))
        .where(and(...conditions))
        .orderBy(desc(programmes.startDate))

    return results.map(r => ({ ...r.programme, organization: r.organization }))
}

// For Admin Dashboard (My Programmes + Approvals)
export async function getAdminProgrammes(organizationId: string, type: 'MY_PROGRAMMES' | 'TO_APPROVE') {
    const creator = aliasedTable(users, "creator")
    const org = aliasedTable(organizations, "org")

    if (type === 'MY_PROGRAMMES') {
        const results = await db.select({ programme: programmes, creator: creator })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .where(eq(programmes.organizationId, organizationId))
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ ...r.programme, creator: r.creator }))
    }

    if (type === 'TO_APPROVE') {
        // Complex logic:
        // If I am state, I see PENDING_STATE from my child branches (or all branches in my state)
        // If I am national, I see PENDING_NATIONAL from states

        const [myOrg] = await db.select().from(organizations).where(eq(organizations.id, organizationId))
        if (!myOrg) return []

        let condition = sql`1=0` // Default fail

        if (myOrg.level === 'STATE') {
            // Need to find programmes where status is PENDING_STATE and org.parentId = myId OR org is in my state
            // For simplicity, let's assume hierarchy: Org Parent ID linkage
            condition = eq(programmes.status, 'PENDING_STATE')
        } else if (myOrg.level === 'NATIONAL') {
            condition = eq(programmes.status, 'PENDING_NATIONAL')
        }

        const results = await db.select({
            programme: programmes,
            creator: creator,
            org: org
        })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .leftJoin(org, eq(programmes.organizationId, org.id))
            .where(condition)
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ ...r.programme, creator: r.creator, organization: r.org }))
    }
}

// --- Registration ---

export async function registerForProgramme(programmeId: string, userId?: string, memberId?: string) {
    // If not logged in, maybe allow guest registration with name/email passed in data?
    // For now assume user is logged in
    const session = await getServerSession()
    if (!session?.user) return { success: false, error: "Must be logged in" }

    try {
        await db.insert(programmeRegistrations).values({
            programmeId,
            userId: session.user.id,
            // memberId: ... fetch if exists
            name: session.user.name || "Unknown",
            email: session.user.email || "Unknown",
            status: 'REGISTERED'
        })
        return { success: true }
    } catch (e) {
        return { success: false, error: "Registration failed" }
    }
}

// --- Reporting ---

export async function submitProgrammeReport(programmeId: string, data: z.infer<typeof ReportSchema>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = ReportSchema.parse(data)

        await db.insert(programmeReports).values({
            programmeId,
            summary: validData.summary,
            challenges: validData.challenges,
            comments: validData.comments,
            attendeesMale: validData.attendeesMale,
            attendeesFemale: validData.attendeesFemale,
            amountSpent: validData.amountSpent.toString(),
            images: validData.images || null,
            submittedBy: session.user.id,
        })

        await db.update(programmes).set({ status: 'COMPLETED' }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Report submission failed" }
    }
}

// --- Attendance & Certificates ---

export async function markAttendance(registrationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmeRegistrations).set({
            status: 'ATTENDED'
        }).where(eq(programmeRegistrations.id, registrationId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to mark attendance" }
    }
}

export async function getUserRegistrations() {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    const results = await db.select({
        registration: programmeRegistrations,
        programme: programmes
    })
        .from(programmeRegistrations)
        .leftJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(eq(programmeRegistrations.userId, session.user.id))
        .orderBy(desc(programmes.startDate))

    return results.map(r => ({
        ...r.registration,
        programme: r.programme
    }))
}
