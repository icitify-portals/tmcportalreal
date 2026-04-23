"use server"

import { db } from "@/lib/db"
import {
    programmes, programmeRegistrations, programmeReports,
    programmeStatusEnum, registrationStatusEnum,
    users, organizations, offices, officials
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

export async function getOfficials(organizationId: string) {
    try {
        const results = await db.select({
            id: officials.id,
            position: officials.position,
            name: users.name
        })
            .from(officials)
            .innerJoin(users, eq(officials.userId, users.id))
            .where(eq(officials.organizationId, organizationId))
        return results
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
    organizingOfficeId: z.string().optional().nullable(),
    organizingOfficialId: z.string().optional().nullable(),
    // New Planner Fields
    format: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']).default('PHYSICAL'),
    frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY']).default('ONCE'),
    budget: z.number().nonnegative().default(0),
    objectives: z.string().optional(),
    committee: z.string().optional(),
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

        // Hierarchical Permission Check
        if (!session.user.isSuperAdmin) {
            const userLevel = session.user.officialLevel as string
            const targetLevel = org.level

            if (userLevel === 'NATIONAL' && targetLevel !== 'NATIONAL') {
                return { success: false, error: "National admins can only create programmes for National level" }
            }
            if (userLevel === 'STATE') {
                if (!['STATE', 'LOCAL_GOVERNMENT', 'BRANCH'].includes(targetLevel)) {
                    return { success: false, error: "State admins can only create for State, LGA, or Branch levels" }
                }
                // Admin must be from the same state
                const userState = (session.user as any).state
                if (userState && org.state && userState !== org.state) {
                    return { success: false, error: `You can only create programmes for your state (${userState})` }
                }
            }
            if (userLevel === 'LOCAL_GOVERNMENT' && targetLevel !== 'LOCAL_GOVERNMENT') {
                return { success: false, error: "LGA admins can only create for LGA level" }
            }
            if (userLevel === 'BRANCH' && targetLevel !== 'BRANCH') {
                return { success: false, error: "Branch admins can only create for Branch level" }
            }
        }

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
            initialStatus = 'PENDING_NATIONAL'
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
            organizingOfficeId: (validData.organizingOfficeId && validData.organizingOfficeId !== "none") ? validData.organizingOfficeId : null,
            organizingOfficialId: (validData.organizingOfficialId && validData.organizingOfficialId !== "none") ? validData.organizingOfficialId : null,
            format: validData.format,
            frequency: validData.frequency,
            budget: validData.budget.toString(),
            objectives: validData.objectives,
            committee: validData.committee,
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

        // Prevent self-approval for National programmes
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (prog && prog.createdBy === session.user.id && !session.user.isSuperAdmin) {
            return { success: false, error: "Self-approval is not allowed. Must be approved by another admin or assigned officer." }
        }

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

export async function rejectProgramme(programmeId: string, reason: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmes).set({
            status: 'REJECTED',
            rejectionReason: reason,
            updatedAt: new Date(),
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Reject Programme Error:", error)
        return { success: false, error: "Rejection failed" }
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
    if (filters?.state) {
        conditions.push(eq(org.state, filters.state))
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
    const office = aliasedTable(offices, "office")
    const official = aliasedTable(officials, "official")
    const officialUser = aliasedTable(users, "officialUser")

    if (type === 'MY_PROGRAMMES') {
        const results = await db.select({
            programme: programmes,
            creator: creator,
            office: office,
            official: official,
            officialUser: officialUser
        })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .leftJoin(office, eq(programmes.organizingOfficeId, office.id))
            .leftJoin(official, eq(programmes.organizingOfficialId, official.id))
            .leftJoin(officialUser, eq(official.userId, officialUser.id))
            .where(eq(programmes.organizationId, organizationId))
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ 
            ...r.programme, 
            creator: r.creator, 
            office: r.office,
            official: r.official ? { ...r.official, user: r.officialUser } : null
        }))
    }

    if (type === 'TO_APPROVE') {
        const session = await getServerSession()
        const isSuperAdmin = session?.user?.isSuperAdmin

        let myOrg = null
        if (organizationId) {
            const orgResults = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
            myOrg = orgResults[0]
        }

        if (!myOrg && !isSuperAdmin) return []

        let condition: any = sql`1=0`

        if (isSuperAdmin) {
            // SuperAdmins see all pending programmes (State and National level)
            condition = or(
                eq(programmes.status, 'PENDING_STATE'),
                eq(programmes.status, 'PENDING_NATIONAL')
            )
        } else if (myOrg && myOrg.level === 'STATE') {
            condition = and(
                eq(programmes.status, 'PENDING_STATE'),
                or(
                    eq(programmes.organizationId, organizationId),
                    eq(org.parentId, organizationId),
                    sql`${org.parentId} IN (SELECT id FROM organizations WHERE parentId = ${organizationId} OR id = ${organizationId})`
                )
            )
        } else if (myOrg && myOrg.level === 'NATIONAL') {
            condition = eq(programmes.status, 'PENDING_NATIONAL')
        }

        const results = await db.select({
            programme: programmes,
            creator: creator,
            org: org,
            office: office,
            official: official,
            officialUser: officialUser
        })
            .from(programmes)
            .leftJoin(creator, eq(programmes.createdBy, creator.id))
            .leftJoin(org, eq(programmes.organizationId, org.id))
            .leftJoin(office, eq(programmes.organizingOfficeId, office.id))
            .leftJoin(official, eq(programmes.organizingOfficialId, official.id))
            .leftJoin(officialUser, eq(official.userId, officialUser.id))
            .where(condition)
            .orderBy(desc(programmes.createdAt))

        return results.map(r => ({ 
            ...r.programme, 
            creator: r.creator, 
            organization: r.org, 
            office: r.office,
            official: r.official ? { ...r.official, user: r.officialUser } : null
        }))
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

export async function deleteProgramme(programmeId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Optional: Check permissions (e.g. only Admin or Creator)

        await db.delete(programmes).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Delete Programme Error:", error)
        return { success: false, error: "Failed to delete programme" }
    }
}

export async function updateProgramme(programmeId: string, data: Partial<z.infer<typeof ProgrammeSchema>>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = ProgrammeSchema.partial().parse(data)

        const [current] = await db.select().from(programmes).where(eq(programmes.id, programmeId))
        if (!current) return { success: false, error: "Programme not found" }

        // Determine if this is a re-submission
        let newStatus = current.status
        let rejectionReason = current.rejectionReason

        if (current.status === 'REJECTED') {
            // Fetch organization level to determine re-submission status
            const [org] = await db.select().from(organizations).where(eq(organizations.id, current.organizationId))
            if (org) {
                if (org.level === 'BRANCH' || org.level === 'LOCAL_GOVERNMENT') {
                    newStatus = 'PENDING_STATE'
                } else if (org.level === 'STATE') {
                    newStatus = 'PENDING_NATIONAL'
                } else if (org.level === 'NATIONAL') {
                    newStatus = 'APPROVED'
                }
            }
            rejectionReason = null // Clear reason on re-submission
        }

        await db.update(programmes).set({
            title: validData.title,
            description: validData.description,
            venue: validData.venue,
            startDate: validData.startDate,
            endDate: validData.endDate,
            time: validData.time,
            targetAudience: validData.targetAudience,
            paymentRequired: validData.paymentRequired,
            amount: validData.amount !== undefined ? validData.amount.toString() : undefined,
            organizingOfficeId: validData.organizingOfficeId,
            organizingOfficialId: validData.organizingOfficialId,
            format: validData.format,
            frequency: validData.frequency,
            budget: validData.budget !== undefined ? validData.budget.toString() : undefined,
            objectives: validData.objectives,
            committee: validData.committee,
            status: newStatus,
            rejectionReason,
            updatedAt: new Date()
        }).where(eq(programmes.id, programmeId))

        revalidatePath("/dashboard/admin/programmes")
        return { success: true }
    } catch (error) {
        console.error("Update Programme Error:", error)
        return { success: false, error: "Failed to update programme" }
    }
}
