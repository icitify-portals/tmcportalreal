"use server"

import { db } from "@/lib/db"
import { 
    programmes, 
    programmeMealSchedules, 
    programmeMealRatings, 
    programmeCampObservations, 
    programmeSchedules,
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
