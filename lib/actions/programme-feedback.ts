"use server"

import { db } from "@/lib/db"
import { programmes, programmeFeedbackSubmissions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

export async function saveProgrammeFeedbackFields(programmeId: string, fields: any[]) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(programmes)
            .set({ feedbackFields: fields })
            .where(eq(programmes.id, programmeId))

        revalidatePath(`/dashboard/admin/programmes/${programmeId}/feedback`)
        return { success: true }
    } catch (err: any) {
        console.error("saveProgrammeFeedbackFields error:", err)
        return { success: false, error: err.message }
    }
}

export async function submitProgrammeFeedback(programmeId: string, data: Record<string, any>) {
    try {
        let userId: string | null = null
        try {
            const session = await getServerSession()
            userId = session?.user?.id || null
        } catch {
            // Not logged in, public or guest feedback submission
        }

        await db.insert(programmeFeedbackSubmissions).values({
            programmeId,
            userId,
            data,
            submittedAt: new Date(),
        })

        return { success: true }
    } catch (err: any) {
        console.error("submitProgrammeFeedback error:", err)
        return { success: false, error: err.message }
    }
}

export async function getProgrammeFeedbackSubmissions(programmeId: string) {
    try {
        const results = await db.select()
            .from(programmeFeedbackSubmissions)
            .where(eq(programmeFeedbackSubmissions.programmeId, programmeId))
            .orderBy(desc(programmeFeedbackSubmissions.submittedAt))

        return results
    } catch (err) {
        console.error("getProgrammeFeedbackSubmissions error:", err)
        return []
    }
}

import { programmeRegistrations } from "@/lib/db/schema"

export async function getProgrammeFeedbackSummary(programmeId: string) {
    try {
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1)
        if (!prog) return null

        const submissions = await db.select()
            .from(programmeFeedbackSubmissions)
            .where(eq(programmeFeedbackSubmissions.programmeId, programmeId))

        const registrations = await db.select()
            .from(programmeRegistrations)
            .where(eq(programmeRegistrations.programmeId, programmeId))

        return {
            programme: prog,
            submissions,
            registrations,
        }
    } catch (err) {
        console.error("getProgrammeFeedbackSummary error:", err)
        return null
    }
}
