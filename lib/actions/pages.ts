
"use server"

import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PageSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
    content: z.string().optional(),
    isPublished: z.boolean().default(false),
    organizationId: z.string().min(1, "Organization is required"),
    metadata: z.any().optional(),
})

export async function getPageBySlug(slug: string, organizationId: string) {
    try {
        const page = await db.query.pages.findFirst({
            where: and(
                eq(pages.slug, slug),
                eq(pages.organizationId, organizationId)
            ),
        })
        return { success: true, data: page }
    } catch (error) {
        console.error("Failed to fetch page:", error)
        return { success: false, error: "Failed to fetch page" }
    }
}

export async function getAllPages(organizationId: string) {
    try {
        const allPages = await db.query.pages.findMany({
            where: eq(pages.organizationId, organizationId),
            orderBy: [desc(pages.updatedAt)],
        })
        return { success: true, data: allPages }
    } catch (error) {
        console.error("Failed to fetch pages:", error)
        return { success: false, error: "Failed to fetch pages" }
    }
}

export async function savePage(data: z.infer<typeof PageSchema> & { id?: string }) {
    try {
        const validData = PageSchema.parse(data)

        if (data.id) {
            // Check slug uniqueness excluding self
            const existing = await db.query.pages.findFirst({
                where: and(
                    eq(pages.slug, validData.slug),
                    eq(pages.organizationId, validData.organizationId)
                )
            })

            if (existing && existing.id !== data.id) {
                return { success: false, error: "Slug already exists in this organization" }
            }

            await db.update(pages).set({
                ...validData,
                updatedAt: new Date(),
            }).where(eq(pages.id, data.id))
        } else {
            // Check if slug exists in org
            const existing = await db.query.pages.findFirst({
                where: and(
                    eq(pages.slug, validData.slug),
                    eq(pages.organizationId, validData.organizationId)
                )
            })
            if (existing) {
                return { success: false, error: "Slug already exists in this organization" }
            }

            await db.insert(pages).values({
                ...validData,
            })
        }

        revalidatePath("/dashboard/admin/cms/pages")
        // We can't easily revalidate the public path without knowing the org code here, 
        // but typically it's under /[jurisdiction]/p/[slug]

        return { success: true }
    } catch (error) {
        console.error("Failed to save page:", error)
        return { success: false, error: "Failed to save page" }
    }
}

export async function deletePage(id: string) {
    try {
        await db.delete(pages).where(eq(pages.id, id))
        revalidatePath("/dashboard/admin/cms/pages")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete page" }
    }
}
