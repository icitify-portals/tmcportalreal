"use server"

import { db } from "@/lib/db"
import { adhkarCentres } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type AdhkarCentreData = typeof adhkarCentres.$inferSelect
export type AdhkarCentreInput = typeof adhkarCentres.$inferInsert

export async function getAdhkarCentres(filters?: { state?: string, lga?: string, query?: string }) {
    try {
        const conditions = [eq(adhkarCentres.isActive, true)]

        if (filters?.state && filters.state !== 'all') {
            conditions.push(eq(adhkarCentres.state, filters.state))
        }

        if (filters?.lga && filters.lga !== 'all') {
            conditions.push(eq(adhkarCentres.lga, filters.lga))
        }

        // Note: Full text search might be better done client side for small datasets or using dedicated search
        // For now we will fetch and filter if query exists, or just rely on client filtering as per user snippet

        const data = await db.query.adhkarCentres.findMany({
            where: and(...conditions),
            orderBy: [desc(adhkarCentres.createdAt)]
        })

        return { success: true, data }
    } catch (error) {
        console.error("Failed to fetch adhkar centres:", error)
        return { success: false, error: "Failed to fetch centres" }
    }
}

export async function saveAdhkarCentre(data: AdhkarCentreInput) {
    try {
        if (data.id) {
            await db.update(adhkarCentres)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(adhkarCentres.id, data.id))
        } else {
            await db.insert(adhkarCentres).values(data)
        }
        revalidatePath("/adhkar")
        revalidatePath("/dashboard/admin/adhkar")
        return { success: true }
    } catch (error) {
        console.error("Failed to save adhkar centre:", error)
        return { success: false, error: "Failed to save centre" }
    }
}

export async function deleteAdhkarCentre(id: string) {
    try {
        await db.delete(adhkarCentres).where(eq(adhkarCentres.id, id))
        revalidatePath("/adhkar")
        revalidatePath("/dashboard/admin/adhkar")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete adhkar centre:", error)
        return { success: false, error: "Failed to delete centre" }
    }
}
