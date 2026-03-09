"use server"

import { db } from "@/lib/db"
import { competitions, competitionSubmissions, organizations } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

// ─── Types ──────────────────────────────────────────────────────────────────────
export interface CompetitionField {
    id: string
    label: string
    type: "text" | "email" | "number" | "tel" | "date" | "select" | "textarea"
    required: boolean
    placeholder?: string
    options?: string[] // For select fields
    validation?: { min?: number; max?: number; pattern?: string }
}

export interface CompetitionFormData {
    title: string
    description?: string
    year: number
    startDate: string
    endDate: string
    organizationId?: string
    fields: CompetitionField[]
}

// ─── Admin: Create Competition ──────────────────────────────────────────────────
export async function createCompetition(data: CompetitionFormData) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const [result] = await db.insert(competitions).values({
        title: data.title,
        description: data.description || null,
        year: data.year,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizationId: data.organizationId || null,
        fields: data.fields,
        status: "ACTIVE",
    }).$returningId()

    revalidatePath("/dashboard/admin/competitions")
    return { success: true, id: result.id }
}

// ─── Admin: Update Competition ──────────────────────────────────────────────────
export async function updateCompetition(id: string, data: Partial<CompetitionFormData> & { status?: string }) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const updateData: Record<string, unknown> = {}
    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.year) updateData.year = data.year
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId
    if (data.fields) updateData.fields = data.fields
    if (data.status) updateData.status = data.status

    await db.update(competitions).set(updateData).where(eq(competitions.id, id))

    revalidatePath("/dashboard/admin/competitions")
    return { success: true }
}

// ─── Admin: Delete Competition ──────────────────────────────────────────────────
export async function deleteCompetition(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.delete(competitions).where(eq(competitions.id, id))

    revalidatePath("/dashboard/admin/competitions")
    return { success: true }
}

// ─── Admin: Get All Competitions ────────────────────────────────────────────────
export async function getCompetitions() {
    const results = await db.select({
        competition: competitions,
        organization: organizations,
    })
        .from(competitions)
        .leftJoin(organizations, eq(competitions.organizationId, organizations.id))
        .orderBy(desc(competitions.year), desc(competitions.createdAt))

    return results.map(r => ({
        ...r.competition,
        organizationName: r.organization?.name || "National",
    }))
}

// ─── Admin: Get Competition by ID ───────────────────────────────────────────────
export async function getCompetitionById(id: string) {
    const results = await db.select({
        competition: competitions,
        organization: organizations,
    })
        .from(competitions)
        .leftJoin(organizations, eq(competitions.organizationId, organizations.id))
        .where(eq(competitions.id, id))
        .limit(1)

    if (results.length === 0) return null

    return {
        ...results[0].competition,
        organizationName: results[0].organization?.name || "National",
    }
}

// ─── Public: Get Active Competitions ────────────────────────────────────────────
export async function getActiveCompetitions() {
    const results = await db.select({
        competition: competitions,
        organization: organizations,
    })
        .from(competitions)
        .leftJoin(organizations, eq(competitions.organizationId, organizations.id))
        .where(eq(competitions.status, "ACTIVE"))
        .orderBy(desc(competitions.year))

    return results.map(r => ({
        ...r.competition,
        organizationName: r.organization?.name || "National",
    }))
}

// ─── Public: Submit Application ─────────────────────────────────────────────────
export async function submitCompetitionApplication(competitionId: string, data: Record<string, unknown>) {
    // Optional: get session if user is logged in
    let userId: string | null = null
    try {
        const session = await getServerSession()
        userId = session?.user?.id || null
    } catch {
        // Public form, user may not be logged in
    }

    // Verify competition is active
    const [competition] = await db.select().from(competitions).where(
        and(eq(competitions.id, competitionId), eq(competitions.status, "ACTIVE"))
    )
    if (!competition) return { success: false, error: "Competition is no longer accepting applications" }

    // Check if registration deadline has passed
    if (new Date() > new Date(competition.endDate)) {
        return { success: false, error: "Registration deadline has passed" }
    }

    const [result] = await db.insert(competitionSubmissions).values({
        competitionId,
        userId,
        data,
        status: "SUBMITTED",
    }).$returningId()

    return { success: true, submissionId: result.id }
}

// ─── Admin: Get Submissions ─────────────────────────────────────────────────────
export async function getCompetitionSubmissions(competitionId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return []

    const results = await db.select()
        .from(competitionSubmissions)
        .where(eq(competitionSubmissions.competitionId, competitionId))
        .orderBy(desc(competitionSubmissions.submittedAt))

    return results
}

// ─── Admin: Update Submission Status ────────────────────────────────────────────
export async function updateSubmissionStatus(submissionId: string, status: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.update(competitionSubmissions)
        .set({ status })
        .where(eq(competitionSubmissions.id, submissionId))

    return { success: true }
}

// ─── Admin: Get Submission Count ────────────────────────────────────────────────
export async function getSubmissionCount(competitionId: string) {
    const results = await db.select()
        .from(competitionSubmissions)
        .where(eq(competitionSubmissions.competitionId, competitionId))

    return results.length
}
