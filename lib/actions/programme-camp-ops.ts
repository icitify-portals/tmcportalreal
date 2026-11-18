"use server"

import { db } from "@/lib/db"
import { 
    programmes, 
    programmeMealSchedules, 
    programmeMealRatings, 
    programmeCampObservations, 
    programmeSchedules,
    programmeVisitors,
    programmeGatePasses,
    programmeVendors,
    programmeDepartments,
    programmeDepartmentAssessments,
    programmeDepartmentReviews,
    programmeDepartmentActivityLogs,
    programmeAnnouncements,
    programmeChannelMessages,
    programmeVirtualConfigs,
    programmeVirtualCheckins,
    programmeVirtualQuestions,
    programmeMaterials,
    users,
    programmeRegistrations
} from "@/lib/db/schema"
import { eq, and, desc, asc, sql } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// ============================================================================
// 1. FOOD TIMETABLE & MEAL RATINGS
// ============================================================================

export async function getProgrammeMealSchedules(programmeId: string) {
    try {
        const meals = await db.select()
            .from(programmeMealSchedules)
            .where(eq(programmeMealSchedules.programmeId, programmeId))
            .orderBy(asc(programmeMealSchedules.dayNumber), asc(programmeMealSchedules.createdAt))
        
        return { success: true, data: meals }
    } catch (error: any) {
        console.error("Error fetching meal schedules:", error)
        return { success: false, error: error.message || "Failed to fetch meal schedule", data: [] }
    }
}

export async function createProgrammeMealSchedule(data: {
    programmeId: string
    dayNumber: number
    date?: string
    mealType: string
    menuTitle: string
    description?: string
    servingTime?: string
    venue?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const id = uuidv4()
        await db.insert(programmeMealSchedules).values({
            id,
            programmeId: data.programmeId,
            dayNumber: Number(data.dayNumber) || 1,
            date: data.date?.trim() || null,
            mealType: data.mealType.toUpperCase(),
            menuTitle: data.menuTitle.trim(),
            description: data.description?.trim() || null,
            servingTime: data.servingTime?.trim() || null,
            venue: data.venue?.trim() || "Main Dining Hall",
            createdBy: session.user.id,
            isActive: true,
        })

        revalidatePath(`/programmes/${data.programmeId}/meals`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/meals`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Create meal schedule error:", error)
        return { success: false, error: error.message || "Failed to save meal schedule" }
    }
}

export async function updateProgrammeMealSchedule(id: string, data: {
    programmeId: string
    dayNumber?: number
    date?: string
    mealType?: string
    menuTitle?: string
    description?: string
    servingTime?: string
    venue?: string
    isActive?: boolean
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.update(programmeMealSchedules).set({
            ...(data.dayNumber !== undefined ? { dayNumber: Number(data.dayNumber) } : {}),
            ...(data.date !== undefined ? { date: data.date.trim() } : {}),
            ...(data.mealType ? { mealType: data.mealType.toUpperCase() } : {}),
            ...(data.menuTitle ? { menuTitle: data.menuTitle.trim() } : {}),
            ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
            ...(data.servingTime !== undefined ? { servingTime: data.servingTime?.trim() || null } : {}),
            ...(data.venue !== undefined ? { venue: data.venue?.trim() || null } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            updatedAt: new Date(),
        }).where(eq(programmeMealSchedules.id, id))

        revalidatePath(`/programmes/${data.programmeId}/meals`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/meals`)
        return { success: true }
    } catch (error: any) {
        console.error("Update meal schedule error:", error)
        return { success: false, error: error.message || "Failed to update meal schedule" }
    }
}

export async function deleteProgrammeMealSchedule(id: string, programmeId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.delete(programmeMealSchedules).where(eq(programmeMealSchedules.id, id))
        revalidatePath(`/programmes/${programmeId}/meals`)
        revalidatePath(`/dashboard/admin/programmes/${programmeId}/meals`)
        return { success: true }
    } catch (error: any) {
        console.error("Delete meal schedule error:", error)
        return { success: false, error: error.message || "Failed to delete meal schedule" }
    }
}

export async function submitProgrammeMealRating(data: {
    mealScheduleId: string
    programmeId: string
    registrationId?: string
    raterName?: string
    rating: number
    tasteRating?: number
    portionRating?: number
    timingRating?: number
    hygieneRating?: number
    comment?: string
}) {
    const session = await getServerSession()
    const userId = session?.user?.id || null

    if (!data.mealScheduleId || !data.rating) {
        return { success: false, error: "Rating is required" }
    }

    try {
        // Prevent spam: if user/regId already rated this meal, update it
        let existingId: string | null = null
        if (userId) {
            const [existing] = await db.select({ id: programmeMealRatings.id })
                .from(programmeMealRatings)
                .where(and(
                    eq(programmeMealRatings.mealScheduleId, data.mealScheduleId),
                    eq(programmeMealRatings.userId, userId)
                )).limit(1)
            if (existing) existingId = existing.id
        } else if (data.registrationId) {
            const [existing] = await db.select({ id: programmeMealRatings.id })
                .from(programmeMealRatings)
                .where(and(
                    eq(programmeMealRatings.mealScheduleId, data.mealScheduleId),
                    eq(programmeMealRatings.registrationId, data.registrationId)
                )).limit(1)
            if (existing) existingId = existing.id
        }

        if (existingId) {
            await db.update(programmeMealRatings).set({
                rating: data.rating,
                tasteRating: data.tasteRating || null,
                portionRating: data.portionRating || null,
                timingRating: data.timingRating || null,
                hygieneRating: data.hygieneRating || null,
                comment: data.comment?.trim() || null,
                raterName: data.raterName?.trim() || session?.user?.name || null,
            }).where(eq(programmeMealRatings.id, existingId))
        } else {
            await db.insert(programmeMealRatings).values({
                id: uuidv4(),
                mealScheduleId: data.mealScheduleId,
                programmeId: data.programmeId,
                registrationId: data.registrationId || null,
                userId,
                raterName: data.raterName?.trim() || session?.user?.name || "Delegate",
                rating: Math.max(1, Math.min(5, Number(data.rating))),
                tasteRating: data.tasteRating ? Math.max(1, Math.min(5, Number(data.tasteRating))) : null,
                portionRating: data.portionRating ? Math.max(1, Math.min(5, Number(data.portionRating))) : null,
                timingRating: data.timingRating ? Math.max(1, Math.min(5, Number(data.timingRating))) : null,
                hygieneRating: data.hygieneRating ? Math.max(1, Math.min(5, Number(data.hygieneRating))) : null,
                comment: data.comment?.trim() || null,
            })
        }

        revalidatePath(`/programmes/${data.programmeId}/meals`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/meals`)
        return { success: true }
    } catch (error: any) {
        console.error("Submit meal rating error:", error)
        return { success: false, error: error.message || "Failed to submit rating" }
    }
}

export async function getMealRatingsAnalytics(programmeId: string) {
    try {
        const [meals, ratings] = await Promise.all([
            db.select().from(programmeMealSchedules)
                .where(eq(programmeMealSchedules.programmeId, programmeId))
                .orderBy(asc(programmeMealSchedules.dayNumber)),
            db.select().from(programmeMealRatings)
                .where(eq(programmeMealRatings.programmeId, programmeId))
                .orderBy(desc(programmeMealRatings.createdAt))
        ])

        const mealsWithStats = meals.map(meal => {
            const mealRatings = ratings.filter(r => r.mealScheduleId === meal.id)
            const count = mealRatings.length
            const avgRating = count > 0 
                ? (mealRatings.reduce((acc, curr) => acc + curr.rating, 0) / count).toFixed(1) 
                : "0.0"
            const avgTaste = count > 0 
                ? (mealRatings.filter(r => r.tasteRating).reduce((acc, curr) => acc + (curr.tasteRating || 0), 0) / (mealRatings.filter(r => r.tasteRating).length || 1)).toFixed(1)
                : null

            return {
                ...meal,
                totalRatings: count,
                avgRating: Number(avgRating),
                avgTaste: avgTaste ? Number(avgTaste) : null,
                recentComments: mealRatings.filter(r => r.comment && r.comment.trim().length > 0).slice(0, 5)
            }
        })

        const totalReviews = ratings.length
        const overallAverage = totalReviews > 0
            ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
            : "0.0"

        return {
            success: true,
            meals: mealsWithStats,
            totalReviews,
            overallAverage: Number(overallAverage),
            recentRatings: ratings.slice(0, 20)
        }
    } catch (error: any) {
        console.error("Meal ratings analytics error:", error)
        return { success: false, error: error.message, meals: [], totalReviews: 0, overallAverage: 0, recentRatings: [] }
    }
}

// ============================================================================
// 2. "AS I SEE IT" - REAL-TIME CAMP OBSERVATION BOX
// ============================================================================

export async function submitCampObservation(data: {
    programmeId: string
    registrationId?: string
    submitterName?: string
    isAnonymous?: boolean
    category: string
    title: string
    description: string
    urgency?: string
}) {
    const session = await getServerSession()
    const userId = session?.user?.id || null

    if (!data.programmeId || !data.title || !data.description || !data.category) {
        return { success: false, error: "Please fill out all required fields" }
    }

    try {
        const id = uuidv4()
        const submitter = data.isAnonymous 
            ? "Anonymous Delegate" 
            : (data.submitterName?.trim() || session?.user?.name || "Camp Delegate")

        await db.insert(programmeCampObservations).values({
            id,
            programmeId: data.programmeId,
            registrationId: data.registrationId || null,
            userId: data.isAnonymous ? null : userId,
            submitterName: submitter,
            isAnonymous: !!data.isAnonymous,
            category: data.category.toUpperCase(),
            title: data.title.trim(),
            description: data.description.trim(),
            urgency: (data.urgency || "MEDIUM").toUpperCase(),
            status: "PENDING",
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/as-i-see-it`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Submit camp observation error:", error)
        return { success: false, error: error.message || "Failed to submit observation" }
    }
}

export async function getCampObservations(programmeId: string) {
    try {
        const observations = await db.select()
            .from(programmeCampObservations)
            .where(eq(programmeCampObservations.programmeId, programmeId))
            .orderBy(desc(programmeCampObservations.createdAt))

        return { success: true, data: observations }
    } catch (error: any) {
        console.error("Get observations error:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function updateCampObservationStatus(id: string, programmeId: string, data: {
    status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'FLAGGED_FOR_FINAL_DAY'
    adminNotes?: string
    actionTaken?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.update(programmeCampObservations).set({
            status: data.status,
            ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
            ...(data.actionTaken !== undefined ? { actionTaken: data.actionTaken } : {}),
            resolvedBy: session.user.id,
            resolvedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(programmeCampObservations.id, id))

        revalidatePath(`/dashboard/admin/programmes/${programmeId}/as-i-see-it`)
        return { success: true }
    } catch (error: any) {
        console.error("Update observation status error:", error)
        return { success: false, error: error.message || "Failed to update observation" }
    }
}

// ============================================================================
// 3. PROGRAMME SCHEDULE / TIMETABLE & NEXT ACTION TICKER
// ============================================================================

export async function getProgrammeScheduleTimeline(programmeId: string) {
    try {
        const [prog] = await db.select({
            id: programmes.id,
            title: programmes.title,
            nextActionTicker: programmes.nextActionTicker,
            startDate: programmes.startDate,
            endDate: programmes.endDate,
            venue: programmes.venue,
        }).from(programmes).where(eq(programmes.id, programmeId)).limit(1)

        const schedules = await db.select()
            .from(programmeSchedules)
            .where(eq(programmeSchedules.programmeId, programmeId))
            .orderBy(asc(programmeSchedules.dayNumber), asc(programmeSchedules.displayOrder), asc(programmeSchedules.startTime))

        return { 
            success: true, 
            programme: prog, 
            schedules 
        }
    } catch (error: any) {
        console.error("Get schedule timeline error:", error)
        return { success: false, error: error.message, programme: null, schedules: [] }
    }
}

export async function createProgrammeScheduleItem(data: {
    programmeId: string
    dayNumber: number
    date?: string
    startTime: string
    endTime?: string
    title: string
    speaker?: string
    venue?: string
    category?: string
    description?: string
    displayOrder?: number
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const id = uuidv4()
        await db.insert(programmeSchedules).values({
            id,
            programmeId: data.programmeId,
            dayNumber: Number(data.dayNumber) || 1,
            date: data.date?.trim() || null,
            startTime: data.startTime.trim(),
            endTime: data.endTime?.trim() || null,
            title: data.title.trim(),
            speaker: data.speaker?.trim() || null,
            venue: data.venue?.trim() || null,
            category: (data.category || "LECTURE").toUpperCase(),
            description: data.description?.trim() || null,
            displayOrder: Number(data.displayOrder) || 0,
            isCurrentSession: false,
        })

        revalidatePath(`/programmes/${data.programmeId}/schedule`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/schedule`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Create schedule item error:", error)
        return { success: false, error: error.message || "Failed to create schedule session" }
    }
}

export async function updateProgrammeScheduleItem(id: string, data: {
    programmeId: string
    dayNumber?: number
    date?: string
    startTime?: string
    endTime?: string
    title?: string
    speaker?: string
    venue?: string
    category?: string
    description?: string
    isCurrentSession?: boolean
    displayOrder?: number
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.update(programmeSchedules).set({
            ...(data.dayNumber !== undefined ? { dayNumber: Number(data.dayNumber) } : {}),
            ...(data.date !== undefined ? { date: data.date.trim() } : {}),
            ...(data.startTime ? { startTime: data.startTime.trim() } : {}),
            ...(data.endTime !== undefined ? { endTime: data.endTime?.trim() || null } : {}),
            ...(data.title ? { title: data.title.trim() } : {}),
            ...(data.speaker !== undefined ? { speaker: data.speaker?.trim() || null } : {}),
            ...(data.venue !== undefined ? { venue: data.venue?.trim() || null } : {}),
            ...(data.category ? { category: data.category.toUpperCase() } : {}),
            ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
            ...(data.isCurrentSession !== undefined ? { isCurrentSession: data.isCurrentSession } : {}),
            ...(data.displayOrder !== undefined ? { displayOrder: Number(data.displayOrder) } : {}),
            updatedAt: new Date(),
        }).where(eq(programmeSchedules.id, id))

        revalidatePath(`/programmes/${data.programmeId}/schedule`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/schedule`)
        return { success: true }
    } catch (error: any) {
        console.error("Update schedule item error:", error)
        return { success: false, error: error.message || "Failed to update schedule item" }
    }
}

export async function deleteProgrammeScheduleItem(id: string, programmeId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.delete(programmeSchedules).where(eq(programmeSchedules.id, id))
        revalidatePath(`/programmes/${programmeId}/schedule`)
        revalidatePath(`/dashboard/admin/programmes/${programmeId}/schedule`)
        return { success: true }
    } catch (error: any) {
        console.error("Delete schedule item error:", error)
        return { success: false, error: error.message || "Failed to delete schedule item" }
    }
}

export async function setSessionAsCurrent(scheduleId: string, programmeId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        // Reset all sessions for this programme
        await db.update(programmeSchedules).set({ isCurrentSession: false })
            .where(eq(programmeSchedules.programmeId, programmeId))
        
        // Mark this one active
        await db.update(programmeSchedules).set({ isCurrentSession: true, updatedAt: new Date() })
            .where(eq(programmeSchedules.id, scheduleId))

        revalidatePath(`/programmes/${programmeId}/schedule`)
        revalidatePath(`/dashboard/admin/programmes/${programmeId}/schedule`)
        return { success: true }
    } catch (error: any) {
        console.error("Set current session error:", error)
        return { success: false, error: error.message }
    }
}

export async function updateNextActionTicker(programmeId: string, tickerText: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await db.update(programmes).set({
            nextActionTicker: tickerText.trim() || null,
        }).where(eq(programmes.id, programmeId))

        revalidatePath(`/programmes/${programmeId}/schedule`)
        revalidatePath(`/programmes/${programmeId}/meals`)
        revalidatePath(`/programmes/registrations`)
        return { success: true }
    } catch (error: any) {
        console.error("Update next action ticker error:", error)
        return { success: false, error: error.message }
    }
}

export async function getProgrammeCampDetails(programmeId: string) {
    try {
        const [prog] = await db.select({
            id: programmes.id,
            title: programmes.title,
            nextActionTicker: programmes.nextActionTicker,
            startDate: programmes.startDate,
            endDate: programmes.endDate,
            venue: programmes.venue,
        }).from(programmes).where(eq(programmes.id, programmeId)).limit(1)

        return prog || null
    } catch {
        return null
    }
}

// ============================================================================
// 4. CAMP VISITOR MANAGEMENT
// ============================================================================

export async function getProgrammeVisitors(programmeId: string) {
    try {
        const visitors = await db.select()
            .from(programmeVisitors)
            .where(eq(programmeVisitors.programmeId, programmeId))
            .orderBy(desc(programmeVisitors.createdAt))

        return { success: true, data: visitors }
    } catch (error: any) {
        console.error("Error fetching visitors:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createProgrammeVisitor(data: {
    programmeId: string
    visitorName: string
    phoneNumber: string
    email?: string
    organization?: string
    purpose: string
    hostDelegateName?: string
    hostDelegatePhone?: string
    tagNumber?: string
    securityNotes?: string
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.visitorName || !data.phoneNumber || !data.purpose) {
        return { success: false, error: "Please fill out all required fields" }
    }

    try {
        const id = uuidv4()
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(programmeVisitors)
            .where(eq(programmeVisitors.programmeId, data.programmeId))
        const tag = data.tagNumber?.trim() || `VIS-${String(Number(count[0]?.count || 0) + 1).padStart(3, '0')}`

        await db.insert(programmeVisitors).values({
            id,
            programmeId: data.programmeId,
            visitorName: data.visitorName.trim(),
            phoneNumber: data.phoneNumber.trim(),
            email: data.email?.trim() || null,
            organization: data.organization?.trim() || null,
            purpose: data.purpose.trim(),
            hostDelegateName: data.hostDelegateName?.trim() || null,
            hostDelegatePhone: data.hostDelegatePhone?.trim() || null,
            tagNumber: tag,
            status: "CHECKED_IN",
            securityNotes: data.securityNotes?.trim() || null,
            checkedInBy: session?.user?.name || "Security Desk",
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/visitors`)
        return { success: true, id, tagNumber: tag }
    } catch (error: any) {
        console.error("Create visitor error:", error)
        return { success: false, error: error.message || "Failed to record visitor" }
    }
}

export async function checkOutProgrammeVisitor(visitorId: string, securityNotes?: string) {
    const session = await getServerSession()
    try {
        const [existing] = await db.select().from(programmeVisitors).where(eq(programmeVisitors.id, visitorId)).limit(1)
        if (!existing) return { success: false, error: "Visitor not found" }

        await db.update(programmeVisitors).set({
            status: "CHECKED_OUT",
            checkOutTime: new Date(),
            checkedOutBy: session?.user?.name || "Security Desk",
            securityNotes: securityNotes ? `${existing.securityNotes ? existing.securityNotes + " | " : ""}${securityNotes}` : existing.securityNotes,
        }).where(eq(programmeVisitors.id, visitorId))

        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/visitors`)
        return { success: true }
    } catch (error: any) {
        console.error("Visitor checkout error:", error)
        return { success: false, error: error.message || "Failed to check out visitor" }
    }
}

export async function deleteProgrammeVisitor(visitorId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select().from(programmeVisitors).where(eq(programmeVisitors.id, visitorId)).limit(1)
        if (!existing) return { success: false, error: "Visitor not found" }

        await db.delete(programmeVisitors).where(eq(programmeVisitors.id, visitorId))
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/visitors`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================================================
// 5. CAMP GATE PASS / IN & OUT MOVEMENT TRACKER
// ============================================================================

export async function getProgrammeGatePasses(programmeId: string) {
    try {
        const passes = await db.select()
            .from(programmeGatePasses)
            .where(eq(programmeGatePasses.programmeId, programmeId))
            .orderBy(desc(programmeGatePasses.createdAt))

        return { success: true, data: passes }
    } catch (error: any) {
        console.error("Error fetching gate passes:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createProgrammeGatePass(data: {
    programmeId: string
    registrationId?: string
    delegateName: string
    phoneNumber: string
    reason: string
    destination: string
    expectedReturnTime: string // ISO string or parsable date string
    notes?: string
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.delegateName || !data.phoneNumber || !data.destination || !data.expectedReturnTime) {
        return { success: false, error: "Please fill out all required fields" }
    }

    try {
        const id = uuidv4()
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(programmeGatePasses)
            .where(eq(programmeGatePasses.programmeId, data.programmeId))
        const passNum = `GP-${String(Number(count[0]?.count || 0) + 1).padStart(4, '0')}`

        await db.insert(programmeGatePasses).values({
            id,
            programmeId: data.programmeId,
            registrationId: data.registrationId || null,
            delegateName: data.delegateName.trim(),
            phoneNumber: data.phoneNumber.trim(),
            passNumber: passNum,
            reason: data.reason.trim(),
            destination: data.destination.trim(),
            expectedReturnTime: new Date(data.expectedReturnTime),
            status: "ACTIVE",
            approvedBy: session?.user?.name || "Camp Marshal",
            securityOfficerExit: session?.user?.name || "Main Gate Security",
            notes: data.notes?.trim() || null,
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/gate-pass`)
        return { success: true, id, passNumber: passNum }
    } catch (error: any) {
        console.error("Create gate pass error:", error)
        return { success: false, error: error.message || "Failed to issue gate pass" }
    }
}

export async function recordGatePassReturn(passId: string, returnNotes?: string) {
    const session = await getServerSession()
    try {
        const [existing] = await db.select().from(programmeGatePasses).where(eq(programmeGatePasses.id, passId)).limit(1)
        if (!existing) return { success: false, error: "Gate pass not found" }

        const now = new Date()
        const isOverdue = existing.expectedReturnTime && now > new Date(existing.expectedReturnTime)

        await db.update(programmeGatePasses).set({
            status: isOverdue ? "RETURNED_LATE" : "RETURNED",
            actualReturnTime: now,
            securityOfficerReturn: session?.user?.name || "Main Gate Security",
            notes: returnNotes ? `${existing.notes ? existing.notes + " | " : ""}${returnNotes}` : existing.notes,
        }).where(eq(programmeGatePasses.id, passId))

        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/gate-pass`)
        return { success: true, isOverdue }
    } catch (error: any) {
        console.error("Gate pass return error:", error)
        return { success: false, error: error.message || "Failed to record return" }
    }
}

export async function cancelProgrammeGatePass(passId: string) {
    try {
        const [existing] = await db.select().from(programmeGatePasses).where(eq(programmeGatePasses.id, passId)).limit(1)
        if (!existing) return { success: false, error: "Gate pass not found" }

        await db.update(programmeGatePasses).set({
            status: "CANCELLED"
        }).where(eq(programmeGatePasses.id, passId))

        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/gate-pass`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================================================
// 6. CAMP VENDOR & BUSINESS REGISTRATION
// ============================================================================

export async function getProgrammeVendors(programmeId: string) {
    try {
        const vendors = await db.select()
            .from(programmeVendors)
            .where(eq(programmeVendors.programmeId, programmeId))
            .orderBy(asc(programmeVendors.stallNumber), asc(programmeVendors.businessName))

        return { success: true, data: vendors }
    } catch (error: any) {
        console.error("Error fetching vendors:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createProgrammeVendor(data: {
    programmeId: string
    businessName: string
    ownerName: string
    phoneNumber: string
    whatsappNumber?: string
    email?: string
    category: string
    description?: string
    stallNumber?: string
    feePaid?: string
    paymentStatus?: string
    securityClearance?: string
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.businessName || !data.ownerName || !data.phoneNumber || !data.category) {
        return { success: false, error: "Please fill out all required fields" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeVendors).values({
            id,
            programmeId: data.programmeId,
            businessName: data.businessName.trim(),
            ownerName: data.ownerName.trim(),
            phoneNumber: data.phoneNumber.trim(),
            whatsappNumber: data.whatsappNumber?.trim() || data.phoneNumber.trim(),
            email: data.email?.trim() || null,
            category: data.category.toUpperCase(),
            description: data.description?.trim() || null,
            stallNumber: data.stallNumber?.trim() || null,
            feePaid: data.feePaid || "0.00",
            paymentStatus: data.paymentStatus || "PENDING",
            securityClearance: data.securityClearance || "APPROVED",
            registeredBy: session?.user?.name || "Business Committee",
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/vendors`)
        revalidatePath(`/programmes/${data.programmeId}/vendors`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Create vendor error:", error)
        return { success: false, error: error.message || "Failed to register vendor" }
    }
}

export async function updateProgrammeVendor(vendorId: string, data: Partial<{
    businessName: string
    ownerName: string
    phoneNumber: string
    whatsappNumber: string
    email: string
    category: string
    description: string
    stallNumber: string
    feePaid: string
    paymentStatus: string
    securityClearance: string
}>) {
    try {
        const [existing] = await db.select().from(programmeVendors).where(eq(programmeVendors.id, vendorId)).limit(1)
        if (!existing) return { success: false, error: "Vendor not found" }

        const updateData: any = {}
        if (data.businessName !== undefined) updateData.businessName = data.businessName.trim()
        if (data.ownerName !== undefined) updateData.ownerName = data.ownerName.trim()
        if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber.trim()
        if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber.trim()
        if (data.email !== undefined) updateData.email = data.email?.trim() || null
        if (data.category !== undefined) updateData.category = data.category.toUpperCase()
        if (data.description !== undefined) updateData.description = data.description?.trim() || null
        if (data.stallNumber !== undefined) updateData.stallNumber = data.stallNumber?.trim() || null
        if (data.feePaid !== undefined) updateData.feePaid = data.feePaid
        if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
        if (data.securityClearance !== undefined) updateData.securityClearance = data.securityClearance

        await db.update(programmeVendors).set(updateData).where(eq(programmeVendors.id, vendorId))

        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/vendors`)
        revalidatePath(`/programmes/${existing.programmeId}/vendors`)
        return { success: true }
    } catch (error: any) {
        console.error("Update vendor error:", error)
        return { success: false, error: error.message || "Failed to update vendor" }
    }
}

export async function deleteProgrammeVendor(vendorId: string) {
    try {
        const [existing] = await db.select().from(programmeVendors).where(eq(programmeVendors.id, vendorId)).limit(1)
        if (!existing) return { success: false, error: "Vendor not found" }

        await db.delete(programmeVendors).where(eq(programmeVendors.id, vendorId))
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/vendors`)
        revalidatePath(`/programmes/${existing.programmeId}/vendors`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================================================
// 7. DEPARTMENTAL KPI ASSESSMENT & ACTIVITY DOCUMENTATION
// ============================================================================

const DEFAULT_DEPARTMENTS = [
    { code: "DAWAH", name: "Dawah & Lectures Directorate", desc: "Sermons, spiritual guidance, lecture moderation, and tahajjud coordination" },
    { code: "WELFARE", name: "Welfare & Feeding Directorate", desc: "Meal preparation, dining hall management, water, and camper nourishment" },
    { code: "ACCOMMODATION", name: "Accommodation & Bedding Committee", desc: "Hostel room allocation, bedding, light, and sanitation" },
    { code: "SECURITY", name: "Security & Safety Directorate", desc: "Camp perimeter guarding, gate passes, visitor vetting, and patrols" },
    { code: "MEDICAL", name: "Medical & Health Services Team", desc: "Camp clinic, first aid, emergency treatment, and hygiene monitoring" },
    { code: "LOGISTICS", name: "Logistics, Sound & Venue Setup", desc: "Public address systems, power generators, seating, and stage arrangement" },
    { code: "MEDIA_IT", name: "Media, Broadcast & IT Directorate", desc: "Live streaming, photography, projection, and portal operations" },
    { code: "FINANCE", name: "Registration & Finance Desk", desc: "Camp registration verification, collections, and financial clearance" },
    { code: "BAZAAR", name: "Bazaar & Commercial Stalls Committee", desc: "Camp market organization, vendor stalls, and commercial regulation" },
    { code: "DISCIPLINE", name: "Discipline & Camp Marshals", desc: "Punctuality, dress code adherence, order, and silence during lights-out" },
]

export async function ensureDefaultProgrammeDepartments(programmeId: string) {
    try {
        const existing = await db.select({ id: programmeDepartments.id })
            .from(programmeDepartments)
            .where(eq(programmeDepartments.programmeId, programmeId))

        if (existing.length === 0) {
            for (let i = 0; i < DEFAULT_DEPARTMENTS.length; i++) {
                const dept = DEFAULT_DEPARTMENTS[i]
                await db.insert(programmeDepartments).values({
                    id: uuidv4(),
                    programmeId,
                    name: dept.name,
                    code: dept.code,
                    description: dept.desc,
                    displayOrder: i + 1,
                    status: "ACTIVE",
                })
            }
        }
        return { success: true }
    } catch (error: any) {
        console.error("Error seeding default departments:", error)
        return { success: false, error: error.message }
    }
}

export async function getProgrammeDepartments(programmeId: string) {
    try {
        await ensureDefaultProgrammeDepartments(programmeId)
        const depts = await db.select()
            .from(programmeDepartments)
            .where(eq(programmeDepartments.programmeId, programmeId))
            .orderBy(asc(programmeDepartments.displayOrder), asc(programmeDepartments.name))

        return { success: true, data: depts }
    } catch (error: any) {
        console.error("Error fetching departments:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createProgrammeDepartment(data: {
    programmeId: string
    name: string
    code: string
    description?: string
    leadOfficerName?: string
    leadOfficerPhone?: string
    leadOfficerEmail?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const id = uuidv4()
        await db.insert(programmeDepartments).values({
            id,
            programmeId: data.programmeId,
            name: data.name.trim(),
            code: data.code.toUpperCase().replace(/\s+/g, '_'),
            description: data.description?.trim() || null,
            leadOfficerName: data.leadOfficerName?.trim() || null,
            leadOfficerPhone: data.leadOfficerPhone?.trim() || null,
            leadOfficerEmail: data.leadOfficerEmail?.trim() || null,
            status: "ACTIVE",
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/departments`)
        return { success: true, id }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function submitDepartmentAssessment(data: {
    programmeId: string
    departmentId: string
    registrationId?: string
    evaluatorName?: string
    overallRating: number
    efficiencyRating?: number
    serviceRating?: number
    conductRating?: number
    impactRating?: number
    commendation?: string
    areasOfImprovement?: string
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.departmentId || !data.overallRating) {
        return { success: false, error: "Please provide a valid rating" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeDepartmentAssessments).values({
            id,
            programmeId: data.programmeId,
            departmentId: data.departmentId,
            registrationId: data.registrationId || null,
            userId: session?.user?.id || null,
            evaluatorName: data.evaluatorName?.trim() || session?.user?.name || "Anonymous Delegate",
            overallRating: Math.min(5, Math.max(1, data.overallRating)),
            efficiencyRating: data.efficiencyRating ? Math.min(5, Math.max(1, data.efficiencyRating)) : null,
            serviceRating: data.serviceRating ? Math.min(5, Math.max(1, data.serviceRating)) : null,
            conductRating: data.conductRating ? Math.min(5, Math.max(1, data.conductRating)) : null,
            impactRating: data.impactRating ? Math.min(5, Math.max(1, data.impactRating)) : null,
            commendation: data.commendation?.trim() || null,
            areasOfImprovement: data.areasOfImprovement?.trim() || null,
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/departments`)
        revalidatePath(`/programmes/${data.programmeId}/departments/assess`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Submit department assessment error:", error)
        return { success: false, error: error.message || "Failed to submit assessment" }
    }
}

export async function getProgrammeDepartmentKPIOverview(programmeId: string) {
    try {
        await ensureDefaultProgrammeDepartments(programmeId)
        const depts = await db.select()
            .from(programmeDepartments)
            .where(eq(programmeDepartments.programmeId, programmeId))
            .orderBy(asc(programmeDepartments.displayOrder))

        const allAssessments = await db.select()
            .from(programmeDepartmentAssessments)
            .where(eq(programmeDepartmentAssessments.programmeId, programmeId))

        const allReviews = await db.select()
            .from(programmeDepartmentReviews)
            .where(eq(programmeDepartmentReviews.programmeId, programmeId))

        const allLogs = await db.select({
            id: programmeDepartmentActivityLogs.id,
            departmentId: programmeDepartmentActivityLogs.departmentId,
        }).from(programmeDepartmentActivityLogs).where(eq(programmeDepartmentActivityLogs.programmeId, programmeId))

        const results = depts.map(dept => {
            const assessments = allAssessments.filter(a => a.departmentId === dept.id)
            const count = assessments.length
            const avgOverall = count > 0 
                ? (assessments.reduce((sum, a) => sum + a.overallRating, 0) / count).toFixed(2)
                : "0.00"
            const avgEfficiency = count > 0 
                ? (assessments.reduce((sum, a) => sum + (a.efficiencyRating || a.overallRating), 0) / count).toFixed(2)
                : "0.00"
            const avgService = count > 0 
                ? (assessments.reduce((sum, a) => sum + (a.serviceRating || a.overallRating), 0) / count).toFixed(2)
                : "0.00"
            const avgConduct = count > 0 
                ? (assessments.reduce((sum, a) => sum + (a.conductRating || a.overallRating), 0) / count).toFixed(2)
                : "0.00"

            const review = allReviews.find(r => r.departmentId === dept.id) || null
            const logCount = allLogs.filter(l => l.departmentId === dept.id).length

            return {
                department: dept,
                assessmentCount: count,
                avgOverall: parseFloat(avgOverall),
                avgEfficiency: parseFloat(avgEfficiency),
                avgService: parseFloat(avgService),
                avgConduct: parseFloat(avgConduct),
                review,
                activityLogCount: logCount,
            }
        })

        return { success: true, data: results }
    } catch (error: any) {
        console.error("Error computing departmental KPI overview:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function saveDepartmentReview(data: {
    programmeId: string
    departmentId: string
    reviewingCommitteeName: string
    committeeScore: number
    finalWeightedScore?: number
    performanceTier: string
    strengths?: string
    weaknesses?: string
    actionableRecommendations?: string
    status: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select()
            .from(programmeDepartmentReviews)
            .where(and(
                eq(programmeDepartmentReviews.programmeId, data.programmeId),
                eq(programmeDepartmentReviews.departmentId, data.departmentId)
            )).limit(1)

        // Calculate current delegate score
        const assessments = await db.select({ rating: programmeDepartmentAssessments.overallRating })
            .from(programmeDepartmentAssessments)
            .where(eq(programmeDepartmentAssessments.departmentId, data.departmentId))
        const delAvg = assessments.length > 0 
            ? assessments.reduce((acc, a) => acc + a.rating, 0) / assessments.length
            : 0

        // Delegate is on 1-5 scale, normalise to percentage: (delAvg / 5) * 100
        const delPercentage = (delAvg / 5) * 100
        const commScore = data.committeeScore || 0
        // Weighted: 40% Delegates + 60% Committee
        const finalWeighted = ((delPercentage * 0.4) + (commScore * 0.6)).toFixed(2)

        const finalizedAt = data.status === "FINALIZED" ? new Date() : null

        if (existing) {
            await db.update(programmeDepartmentReviews).set({
                reviewingCommitteeName: data.reviewingCommitteeName.trim(),
                reviewerUserId: session.user.id,
                delegateAverageScore: delAvg.toFixed(2),
                committeeScore: commScore.toFixed(2),
                finalWeightedScore: finalWeighted,
                performanceTier: data.performanceTier,
                strengths: data.strengths?.trim() || null,
                weaknesses: data.weaknesses?.trim() || null,
                actionableRecommendations: data.actionableRecommendations?.trim() || null,
                status: data.status,
                finalizedAt: finalizedAt || existing.finalizedAt,
            }).where(eq(programmeDepartmentReviews.id, existing.id))
        } else {
            const id = uuidv4()
            await db.insert(programmeDepartmentReviews).values({
                id,
                programmeId: data.programmeId,
                departmentId: data.departmentId,
                reviewingCommitteeName: data.reviewingCommitteeName.trim(),
                reviewerUserId: session.user.id,
                delegateAverageScore: delAvg.toFixed(2),
                committeeScore: commScore.toFixed(2),
                finalWeightedScore: finalWeighted,
                performanceTier: data.performanceTier,
                strengths: data.strengths?.trim() || null,
                weaknesses: data.weaknesses?.trim() || null,
                actionableRecommendations: data.actionableRecommendations?.trim() || null,
                status: data.status,
                finalizedAt,
            })
        }

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/departments`)
        return { success: true }
    } catch (error: any) {
        console.error("Save department review error:", error)
        return { success: false, error: error.message || "Failed to save review" }
    }
}

export async function getDepartmentActivityLogs(programmeId: string, departmentId?: string) {
    try {
        let query = db.select({
            id: programmeDepartmentActivityLogs.id,
            programmeId: programmeDepartmentActivityLogs.programmeId,
            departmentId: programmeDepartmentActivityLogs.departmentId,
            departmentName: programmeDepartments.name,
            departmentCode: programmeDepartments.code,
            activityDate: programmeDepartmentActivityLogs.activityDate,
            title: programmeDepartmentActivityLogs.title,
            activityType: programmeDepartmentActivityLogs.activityType,
            officerInCharge: programmeDepartmentActivityLogs.officerInCharge,
            summary: programmeDepartmentActivityLogs.summary,
            actionItems: programmeDepartmentActivityLogs.actionItems,
            challengesEncountered: programmeDepartmentActivityLogs.challengesEncountered,
            attachmentsUrl: programmeDepartmentActivityLogs.attachmentsUrl,
            createdAt: programmeDepartmentActivityLogs.createdAt,
        }).from(programmeDepartmentActivityLogs)
        .leftJoin(programmeDepartments, eq(programmeDepartmentActivityLogs.departmentId, programmeDepartments.id))
        .where(
            departmentId 
                ? and(eq(programmeDepartmentActivityLogs.programmeId, programmeId), eq(programmeDepartmentActivityLogs.departmentId, departmentId))
                : eq(programmeDepartmentActivityLogs.programmeId, programmeId)
        )
        .orderBy(desc(programmeDepartmentActivityLogs.activityDate))

        const logs = await query
        return { success: true, data: logs }
    } catch (error: any) {
        console.error("Error fetching activity logs:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createDepartmentActivityLog(data: {
    programmeId: string
    departmentId: string
    title: string
    activityType: string
    officerInCharge?: string
    summary: string
    actionItems?: string
    challengesEncountered?: string
    attachmentsUrl?: string
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.departmentId || !data.title || !data.summary) {
        return { success: false, error: "Please fill out all required fields" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeDepartmentActivityLogs).values({
            id,
            programmeId: data.programmeId,
            departmentId: data.departmentId,
            title: data.title.trim(),
            activityType: data.activityType || "DAILY_LOG",
            officerInCharge: data.officerInCharge?.trim() || session?.user?.name || "Duty Officer",
            summary: data.summary.trim(),
            actionItems: data.actionItems?.trim() || null,
            challengesEncountered: data.challengesEncountered?.trim() || null,
            attachmentsUrl: data.attachmentsUrl?.trim() || null,
        })

        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/departments`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Create activity log error:", error)
        return { success: false, error: error.message || "Failed to save activity note" }
    }
}

// ============================================================================
// 8. INFORMATION DISSEMINATION & BROADCAST NOTICEBOARD (ITEM 7)
// ============================================================================

export async function getProgrammeAnnouncements(programmeId: string) {
    try {
        const items = await db.select()
            .from(programmeAnnouncements)
            .where(eq(programmeAnnouncements.programmeId, programmeId))
            .orderBy(desc(programmeAnnouncements.isPinned), desc(programmeAnnouncements.createdAt))

        return { success: true, data: items }
    } catch (error: any) {
        console.error("Error fetching announcements:", error)
        return { success: false, error: error.message || "Failed to load announcements", data: [] }
    }
}

export async function createProgrammeAnnouncement(data: {
    programmeId: string
    title: string
    content: string
    category?: string
    priority?: string
    targetAudience?: string
    attachmentUrl?: string
    isPinned?: boolean
    alsoUpdateTicker?: boolean
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    if (!data.programmeId || !data.title.trim() || !data.content.trim()) {
        return { success: false, error: "Title and message content are required" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeAnnouncements).values({
            id,
            programmeId: data.programmeId,
            title: data.title.trim(),
            content: data.content.trim(),
            category: data.category || "GENERAL",
            priority: data.priority || "NORMAL",
            targetAudience: data.targetAudience || "ALL_DELEGATES",
            attachmentUrl: data.attachmentUrl?.trim() || null,
            authorName: session.user.name || "Camp Secretariat",
            isPinned: !!data.isPinned,
        })

        if (data.alsoUpdateTicker) {
            const tickerSnippet = `${data.title.trim()}: ${data.content.trim().slice(0, 180)}`
            await db.update(programmes).set({
                nextActionTicker: tickerSnippet,
            }).where(eq(programmes.id, data.programmeId))
        }

        revalidatePath(`/programmes/${data.programmeId}/announcements`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/announcements`)
        revalidatePath(`/programmes/${data.programmeId}/schedule`)
        revalidatePath(`/programmes/${data.programmeId}/meals`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Create announcement error:", error)
        return { success: false, error: error.message || "Failed to publish announcement" }
    }
}

export async function togglePinAnnouncement(id: string, isPinned: boolean) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select().from(programmeAnnouncements).where(eq(programmeAnnouncements.id, id)).limit(1)
        if (!existing) return { success: false, error: "Announcement not found" }

        await db.update(programmeAnnouncements).set({ isPinned }).where(eq(programmeAnnouncements.id, id))
        revalidatePath(`/programmes/${existing.programmeId}/announcements`)
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/announcements`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteProgrammeAnnouncement(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select().from(programmeAnnouncements).where(eq(programmeAnnouncements.id, id)).limit(1)
        if (!existing) return { success: false, error: "Announcement not found" }

        await db.delete(programmeAnnouncements).where(eq(programmeAnnouncements.id, id))
        revalidatePath(`/programmes/${existing.programmeId}/announcements`)
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/announcements`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================================================
// 9. DEPARTMENTAL & ZONAL OFFICER INTERACTION CHANNELS (ITEM 9)
// ============================================================================

export async function getProgrammeChannelMessages(programmeId: string, channelKey: string) {
    try {
        const messages = await db.select()
            .from(programmeChannelMessages)
            .where(and(
                eq(programmeChannelMessages.programmeId, programmeId),
                eq(programmeChannelMessages.channelKey, channelKey)
            ))
            .orderBy(asc(programmeChannelMessages.createdAt))

        return { success: true, data: messages }
    } catch (error: any) {
        console.error("Error fetching channel messages:", error)
        return { success: false, error: error.message || "Failed to fetch channel messages", data: [] }
    }
}

export async function postProgrammeChannelMessage(data: {
    programmeId: string
    channelType: string
    channelKey: string
    channelLabel: string
    senderName: string
    senderRole?: string
    content: string
    attachmentUrl?: string
    isPinned?: boolean
}) {
    const session = await getServerSession()
    if (!data.programmeId || !data.channelKey || !data.content.trim()) {
        return { success: false, error: "Message content is required" }
    }

    try {
        const id = uuidv4()
        const finalSenderName = data.senderName?.trim() || session?.user?.name || "Camp Officer"

        await db.insert(programmeChannelMessages).values({
            id,
            programmeId: data.programmeId,
            channelType: data.channelType,
            channelKey: data.channelKey,
            channelLabel: data.channelLabel,
            senderId: session?.user?.id || null,
            senderName: finalSenderName,
            senderRole: data.senderRole?.trim() || "Officer / Member",
            content: data.content.trim(),
            attachmentUrl: data.attachmentUrl?.trim() || null,
            isPinned: !!data.isPinned,
        })

        revalidatePath(`/programmes/${data.programmeId}/channels`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/channels`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Post channel message error:", error)
        return { success: false, error: error.message || "Failed to post message" }
    }
}

export async function togglePinChannelMessage(id: string, isPinned: boolean) {
    try {
        const [existing] = await db.select().from(programmeChannelMessages).where(eq(programmeChannelMessages.id, id)).limit(1)
        if (!existing) return { success: false, error: "Message not found" }

        await db.update(programmeChannelMessages).set({ isPinned }).where(eq(programmeChannelMessages.id, id))
        revalidatePath(`/programmes/${existing.programmeId}/channels`)
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/channels`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================================================
// 10. VIRTUAL PARTICIPANTS HUB (ITEM 10)
// ============================================================================

export async function getVirtualHubData(programmeId: string) {
    try {
        const [prog, configRows, checkins, questions, materials] = await Promise.all([
            getProgrammeCampDetails(programmeId),
            db.select().from(programmeVirtualConfigs).where(eq(programmeVirtualConfigs.programmeId, programmeId)).limit(1),
            db.select().from(programmeVirtualCheckins).where(eq(programmeVirtualCheckins.programmeId, programmeId)).orderBy(desc(programmeVirtualCheckins.checkedInAt)),
            db.select().from(programmeVirtualQuestions).where(eq(programmeVirtualQuestions.programmeId, programmeId)).orderBy(desc(programmeVirtualQuestions.createdAt)),
            db.select().from(programmeMaterials).where(eq(programmeMaterials.programmeId, programmeId)).orderBy(desc(programmeMaterials.createdAt)),
        ])

        return {
            success: true,
            programme: prog,
            config: configRows[0] || null,
            checkins,
            questions,
            materials,
        }
    } catch (error: any) {
        console.error("Error fetching virtual hub data:", error)
        return {
            success: false,
            error: error.message || "Failed to load virtual hub",
            programme: null,
            config: null,
            checkins: [],
            questions: [],
            materials: [],
        }
    }
}

export async function saveVirtualConfig(data: {
    programmeId: string
    streamStatus: string
    videoStreamUrl?: string
    audioStreamUrl?: string
    zoomOrMeetUrl?: string
    currentSessionTitle?: string
    currentSpeaker?: string
    welcomeNote?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select()
            .from(programmeVirtualConfigs)
            .where(eq(programmeVirtualConfigs.programmeId, data.programmeId))
            .limit(1)

        if (existing) {
            await db.update(programmeVirtualConfigs).set({
                streamStatus: data.streamStatus || "LIVE",
                videoStreamUrl: data.videoStreamUrl?.trim() || null,
                audioStreamUrl: data.audioStreamUrl?.trim() || null,
                zoomOrMeetUrl: data.zoomOrMeetUrl?.trim() || null,
                currentSessionTitle: data.currentSessionTitle?.trim() || null,
                currentSpeaker: data.currentSpeaker?.trim() || null,
                welcomeNote: data.welcomeNote?.trim() || null,
            }).where(eq(programmeVirtualConfigs.id, existing.id))
        } else {
            await db.insert(programmeVirtualConfigs).values({
                id: uuidv4(),
                programmeId: data.programmeId,
                streamStatus: data.streamStatus || "LIVE",
                videoStreamUrl: data.videoStreamUrl?.trim() || null,
                audioStreamUrl: data.audioStreamUrl?.trim() || null,
                zoomOrMeetUrl: data.zoomOrMeetUrl?.trim() || null,
                currentSessionTitle: data.currentSessionTitle?.trim() || null,
                currentSpeaker: data.currentSpeaker?.trim() || null,
                welcomeNote: data.welcomeNote?.trim() || null,
            })
        }

        revalidatePath(`/programmes/${data.programmeId}/virtual`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/virtual`)
        return { success: true }
    } catch (error: any) {
        console.error("Save virtual config error:", error)
        return { success: false, error: error.message || "Failed to save virtual stream config" }
    }
}

export async function submitVirtualCheckin(data: {
    programmeId: string
    registrationId?: string
    delegateName: string
    emailOrPhone?: string
    stateOrBranch?: string
    sessionTitle: string
    dayNumber?: number
}) {
    if (!data.programmeId || !data.delegateName.trim() || !data.sessionTitle.trim()) {
        return { success: false, error: "Please provide your name and session title" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeVirtualCheckins).values({
            id,
            programmeId: data.programmeId,
            registrationId: data.registrationId || null,
            delegateName: data.delegateName.trim(),
            emailOrPhone: data.emailOrPhone?.trim() || null,
            stateOrBranch: data.stateOrBranch?.trim() || null,
            sessionTitle: data.sessionTitle.trim(),
            dayNumber: data.dayNumber || 1,
        })

        revalidatePath(`/programmes/${data.programmeId}/virtual`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/virtual`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Submit virtual checkin error:", error)
        return { success: false, error: error.message || "Failed to record virtual attendance" }
    }
}

export async function submitVirtualQuestion(data: {
    programmeId: string
    sessionTitle?: string
    askerName: string
    stateOrBranch?: string
    question: string
}) {
    if (!data.programmeId || !data.askerName.trim() || !data.question.trim()) {
        return { success: false, error: "Your name and question are required" }
    }

    try {
        const id = uuidv4()
        await db.insert(programmeVirtualQuestions).values({
            id,
            programmeId: data.programmeId,
            sessionTitle: data.sessionTitle?.trim() || "Live Session",
            askerName: data.askerName.trim(),
            stateOrBranch: data.stateOrBranch?.trim() || null,
            question: data.question.trim(),
            status: "PENDING",
        })

        revalidatePath(`/programmes/${data.programmeId}/virtual`)
        revalidatePath(`/dashboard/admin/programmes/${data.programmeId}/virtual`)
        return { success: true, id }
    } catch (error: any) {
        console.error("Submit virtual question error:", error)
        return { success: false, error: error.message || "Failed to submit question" }
    }
}

export async function answerVirtualQuestion(id: string, status: string, answerText?: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const [existing] = await db.select().from(programmeVirtualQuestions).where(eq(programmeVirtualQuestions.id, id)).limit(1)
        if (!existing) return { success: false, error: "Question not found" }

        await db.update(programmeVirtualQuestions).set({
            status,
            answerText: answerText?.trim() || existing.answerText,
        }).where(eq(programmeVirtualQuestions.id, id))

        revalidatePath(`/programmes/${existing.programmeId}/virtual`)
        revalidatePath(`/dashboard/admin/programmes/${existing.programmeId}/virtual`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
