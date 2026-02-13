
"use server"

import { db } from "@/lib/db"
import { fundraisingCampaigns, payments } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { z } from "zod"

const CampaignSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    targetAmount: z.number().min(100),
    startDate: z.date().default(new Date()),
    endDate: z.date().optional().nullable(),
    status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
    organizationId: z.string().min(1, "Organization is required"),
    coverImage: z.string().optional(),
    allowCustomAmount: z.boolean().default(true),
})

export type CampaignInput = z.infer<typeof CampaignSchema>

export async function createCampaign(data: CampaignInput) {
    try {
        const validated = CampaignSchema.parse(data)

        // Check unique slug within organization
        const existing = await db.query.fundraisingCampaigns.findFirst({
            where: and(
                eq(fundraisingCampaigns.slug, validated.slug),
                eq(fundraisingCampaigns.organizationId, validated.organizationId)
            )
        })

        if (existing) {
            return { success: false, error: "Slug already exists for this organization" }
        }

        await db.insert(fundraisingCampaigns).values({
            ...validated,
            targetAmount: validated.targetAmount.toString(),
        })

        revalidatePath("/dashboard/admin/finance/campaigns")
        // revalidateTag(`campaigns-${validated.organizationId}`)
        // revalidateTag('campaigns')
        return { success: true }
    } catch (error) {
        console.error("Failed to create campaign:", error)
        return { success: false, error: "Failed to create campaign" }
    }
}

export async function updateCampaign(id: string, data: Partial<CampaignInput>) {
    try {
        // We don't validate specific fields here strictly to allow partial updates, but should be careful
        await db.update(fundraisingCampaigns)
            .set({
                ...data,
                targetAmount: data.targetAmount ? data.targetAmount.toString() : undefined,
                updatedAt: new Date(),
            })
            .where(eq(fundraisingCampaigns.id, id))

        revalidatePath("/dashboard/admin/finance/campaigns")
        // revalidateTag('campaigns')
        return { success: true }
    } catch (error) {
        console.error("Failed to update campaign:", error)
        return { success: false, error: "Failed to update campaign" }
    }
}

export async function deleteCampaign(id: string) {
    try {
        await db.delete(fundraisingCampaigns).where(eq(fundraisingCampaigns.id, id))
        revalidatePath("/dashboard/admin/finance/campaigns")
        // revalidateTag('campaigns')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete campaign:", error)
        return { success: false, error: "Failed to delete campaign" }
    }
}

export async function getCampaigns(organizationId: string) {
    try {
        return await db.query.fundraisingCampaigns.findMany({
            where: eq(fundraisingCampaigns.organizationId, organizationId),
            orderBy: [desc(fundraisingCampaigns.createdAt)]
        })
    } catch (error) {
        console.error("Failed to fetch campaigns:", error)
        return []
    }
}

export const getCampaignBySlug = unstable_cache(
    async (organizationId: string, slug: string) => {
        try {
            return await db.query.fundraisingCampaigns.findFirst({
                where: and(
                    eq(fundraisingCampaigns.organizationId, organizationId),
                    eq(fundraisingCampaigns.slug, slug)
                )
            })
        } catch (error) {
            console.error("Failed to fetch campaign:", error)
            return null
        }
    },
    ['campaign-by-slug'],
    { tags: ['campaigns'] }
)

export const getActiveCampaigns = unstable_cache(
    async (organizationId: string) => {
        try {
            return await db.query.fundraisingCampaigns.findMany({
                where: and(
                    eq(fundraisingCampaigns.organizationId, organizationId),
                    eq(fundraisingCampaigns.status, 'ACTIVE')
                ),
                orderBy: [desc(fundraisingCampaigns.createdAt)]
            })
        } catch (error) {
            console.error("Failed to fetch active campaigns:", error)
            return []
        }
    },
    ['active-campaigns'],
    { tags: ['campaigns'] }
)
