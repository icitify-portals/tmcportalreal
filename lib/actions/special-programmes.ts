"use server"

import { db } from "@/lib/db"
import {
    specialProgrammes,
    specialProgrammeFiles,
    organizations,
    users,
    specialProgrammeCategoryEnum,
    specialProgrammeFileTypeEnum
} from "@/lib/db/schema"
import { eq, desc, and, or, sql, inArray } from "drizzle-orm"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"

const SpecialProgrammeSchema = z.object({
    category: z.enum(['TESKIYAH_WORKSHOP', 'FRIDAY_KHUTHBAH', 'PRESS_RELEASE', 'STATE_OF_THE_NATION', 'OTHER']),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    summary: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    date: z.date().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    isPublished: z.boolean().default(true),
})

const FileSchema = z.object({
    title: z.string().min(1, "File title is required"),
    url: z.string().url("Invalid file URL"),
    type: z.enum(['AUDIO', 'VIDEO', 'DOCUMENT', 'OTHER']),
    order: z.number().int().default(0),
})

export async function createSpecialProgramme(
    data: z.infer<typeof SpecialProgrammeSchema>,
    files: z.infer<typeof FileSchema>[]
) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1)
        if (!nationalOrg) return { success: false, error: "National organization not found" }

        const validData = SpecialProgrammeSchema.parse(data)

        const [newProgramme] = await db.transaction(async (tx) => {
            const [inserted] = await tx.insert(specialProgrammes).values({
                organizationId: nationalOrg.id,
                category: validData.category,
                title: validData.title,
                description: validData.description,
                summary: validData.summary,
                year: validData.year,
                date: validData.date,
                imageUrl: validData.imageUrl || null,
                isPublished: validData.isPublished,
                createdBy: session.user.id,
            }).$returningId()

            if (files.length > 0) {
                const fileValues = files.map(f => ({
                    ...FileSchema.parse(f),
                    programmeId: inserted.id
                }))
                await tx.insert(specialProgrammeFiles).values(fileValues)
            }

            return [inserted]
        })

        revalidatePath("/dashboard/admin/special-programmes")
        revalidatePath("/programmes/special")
        // revalidateTag('special-programmes')
        return { success: true, id: newProgramme.id }
    } catch (error: any) {
        console.error("Create Special Programme Error:", error)
        return { success: false, error: error.message || "Failed to create" }
    }
}

export async function updateSpecialProgramme(
    id: string,
    data: z.infer<typeof SpecialProgrammeSchema>,
    files: z.infer<typeof FileSchema>[]
) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = SpecialProgrammeSchema.parse(data)

        await db.transaction(async (tx) => {
            await tx.update(specialProgrammes).set({
                category: validData.category,
                title: validData.title,
                description: validData.description,
                summary: validData.summary,
                year: validData.year,
                date: validData.date,
                imageUrl: validData.imageUrl || null,
                isPublished: validData.isPublished,
            }).where(eq(specialProgrammes.id, id))

            await tx.delete(specialProgrammeFiles).where(eq(specialProgrammeFiles.programmeId, id))

            if (files.length > 0) {
                const fileValues = files.map(f => ({
                    ...FileSchema.parse(f),
                    programmeId: id
                }))
                await tx.insert(specialProgrammeFiles).values(fileValues)
            }
        })

        revalidatePath("/dashboard/admin/special-programmes")
        revalidatePath(`/dashboard/admin/special-programmes/${id}`)
        revalidatePath("/programmes/special")
        revalidatePath(`/programmes/special/${id}`)
        // revalidateTag('special-programmes')
        return { success: true }
    } catch (error: any) {
        console.error("Update Special Programme Error:", error)
        return { success: false, error: error.message || "Failed to update" }
    }
}

export const getSpecialProgrammes = unstable_cache(
    async (category?: string, year?: number) => {
        try {
            let query = db.select().from(specialProgrammes)
            const conditions = [eq(specialProgrammes.isPublished, true)]

            if (category) conditions.push(eq(specialProgrammes.category, category as any))
            if (year) conditions.push(eq(specialProgrammes.year, year))

            query.where(and(...conditions))
            return await query.orderBy(desc(specialProgrammes.year), desc(specialProgrammes.createdAt))
        } catch (error) {
            return []
        }
    },
    ['special-programmes-list'],
    { tags: ['special-programmes'] }
)

export const getSpecialProgrammeDetails = unstable_cache(
    async (id: string) => {
        try {
            return await db.query.specialProgrammes.findFirst({
                where: eq(specialProgrammes.id, id),
                with: {
                    files: {
                        orderBy: (files, { asc }) => [asc(files.order)]
                    }
                }
            })
        } catch (error) {
            return null
        }
    },
    ['special-programme-details'],
    { tags: ['special-programmes'] }
)
