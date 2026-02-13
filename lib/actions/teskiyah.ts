"use server"

import { db } from "@/lib/db"
import { teskiyahCentres } from "@/lib/db/schema"
import { eq, desc, and, like } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const teskiyahCentreSchema = z.object({
    name: z.string().min(1, "Name is required"),
    venue: z.string().min(1, "Venue is required"),
    address: z.string().min(1, "Address is required"),
    time: z.string().min(1, "Time is required"),
    contactNumber: z.string().optional(),
    state: z.string().min(1, "State is required"),
    lga: z.string().min(1, "LGA is required"),
    branch: z.string().optional(),
    organizationId: z.string().optional(),
    isActive: z.boolean().default(true),
})

export type TeskiyahCentreData = typeof teskiyahCentres.$inferSelect

export async function getTeskiyahCentres(params?: { query?: string, state?: string, lga?: string, branch?: string, limit?: number }) {
    try {
        let conditions = []
        conditions.push(eq(teskiyahCentres.isActive, true))

        if (params?.query) {
            conditions.push(like(teskiyahCentres.name, `%${params.query}%`))
        }
        if (params?.state && params.state !== "all") {
            conditions.push(eq(teskiyahCentres.state, params.state))
        }
        if (params?.lga && params.lga !== "all") {
            conditions.push(eq(teskiyahCentres.lga, params.lga))
        }
        if (params?.branch && params.branch !== "all") {
            conditions.push(eq(teskiyahCentres.branch, params.branch))
        }

        const data = await db.select()
            .from(teskiyahCentres)
            .where(and(...conditions))
            .orderBy(desc(teskiyahCentres.createdAt))
            .limit(params?.limit || 100)

        return { success: true, data }
    } catch (error) {
        console.error("Failed to fetch teskiyah centres:", error)
        return { success: false, error: "Failed to fetch directory" }
    }
}

export async function saveTeskiyahCentre(data: z.infer<typeof teskiyahCentreSchema> & { id?: string }) {
    try {
        const validated = teskiyahCentreSchema.parse(data)

        if (data.id) {
            await db.update(teskiyahCentres)
                .set(validated)
                .where(eq(teskiyahCentres.id, data.id))
        } else {
            await db.insert(teskiyahCentres).values(validated)
        }

        revalidatePath("/teskiyah")
        revalidatePath("/dashboard/admin/teskiyah")
        return { success: true }
    } catch (error) {
        console.error("Failed to save teskiyah centre:", error)
        return { success: false, error: "Failed to save centre" }
    }
}

export async function deleteTeskiyahCentre(id: string) {
    try {
        await db.delete(teskiyahCentres).where(eq(teskiyahCentres.id, id))
        revalidatePath("/teskiyah")
        revalidatePath("/dashboard/admin/teskiyah")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete teskiyah centre:", error)
        return { success: false, error: "Failed to delete centre" }
    }
}
