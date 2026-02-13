"use server"

import { db } from "@/lib/db"
import { galleries, galleryImages, organizations, users, officials } from "@/lib/db/schema"
import { eq, desc, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"

const GallerySchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
})

const ImageSchema = z.object({
    imageUrl: z.string().url("Invalid URL"),
    caption: z.string().optional(),
})

// Helper to validate access
async function validateAdminAccess(userId: string, targetOrganizationId: string) {
    const [user] = await db.select({
        orgId: officials.organizationId,
        orgLevel: organizations.level
    })
        .from(users)
        .leftJoin(officials, eq(users.id, officials.userId))
        .leftJoin(organizations, eq(officials.organizationId, organizations.id))

    const officialRows = await db.select({
        official: officials,
        organization: organizations
    })
        .from(users)
        .innerJoin(officials, eq(users.id, officials.userId))
        .innerJoin(organizations, eq(officials.organizationId, organizations.id))
        .where(eq(users.id, userId))
        .limit(1)

    if (officialRows.length === 0) return false
    const { organization: userOrg } = officialRows[0]

    // 1. Direct match
    if (userOrg.id === targetOrganizationId) return true

    // 2. National Admin - Can manage all? Or specific policy?
    // User requested "each jurisdiction... manage *their respective* gallery".
    // Usually means National manages National, State manages State.
    // But often National manages overall. Restricting to "Respective" usually means "Own Jurisdiction".
    // However, if I am State admin, can I delete a Branch gallery? Usually yes.

    // STRICT MODE as per "manage their respective":
    // If I am strictly enforcing "manage OWN", then strict equality.
    // But "Jurisdiction" often implies the tree.
    // Let's allow Hierarchy:

    if (userOrg.level === 'NATIONAL') return true // Super admin

    if (userOrg.level === 'STATE') {
        // Allow if target is child of State
        // Check if target org's parentId === userOrg.id
        const [targetOrg] = await db.select().from(organizations).where(eq(organizations.id, targetOrganizationId))
        if (targetOrg && targetOrg.parentId === userOrg.id) return true
    }

    return false
}

// --- Gallery Management ---

export async function createGallery(data: z.infer<typeof GallerySchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const hasAccess = await validateAdminAccess(session.user.id, organizationId)
        if (!hasAccess) return { success: false, error: "Insufficient permissions for this jurisdiction" }

        const validData = GallerySchema.parse(data)

        const [newGallery] = await db.insert(galleries).values({
            organizationId,
            title: validData.title,
            description: validData.description,
            isActive: true,
        }).$returningId()

        revalidatePath("/dashboard/admin/galleries")
        return { success: true, galleryId: newGallery.id }
    } catch (error) {
        console.error("Create Gallery Error:", error)
        return { success: false, error: "Failed to create gallery" }
    }
}

export async function deleteGallery(galleryId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const gallery = await db.query.galleries.findFirst({ where: eq(galleries.id, galleryId) })
        if (!gallery) return { success: false, error: "Gallery not found" }

        const hasAccess = await validateAdminAccess(session.user.id, gallery.organizationId)
        if (!hasAccess) return { success: false, error: "Insufficient permissions" }

        await db.delete(galleries).where(eq(galleries.id, galleryId))

        revalidatePath("/dashboard/admin/galleries")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete gallery" }
    }
}

export async function getGalleries(organizationId: string) {
    const galleryList = await db.select()
        .from(galleries)
        .where(eq(galleries.organizationId, organizationId))
        .orderBy(desc(galleries.createdAt))

    const galleryIds = galleryList.map(g => g.id)
    let imagesMap: Record<string, any[]> = {}

    if (galleryIds.length > 0) {
        const allImages = await db.select()
            .from(galleryImages)
            .where(inArray(galleryImages.galleryId, galleryIds))

        allImages.forEach(img => {
            if (!imagesMap[img.galleryId]) imagesMap[img.galleryId] = []
            imagesMap[img.galleryId].push(img)
        })
    }

    const results = galleryList.map(g => ({
        ...g,
        images: imagesMap[g.id] ? [imagesMap[g.id][0]] : []
    }))

    return results
}

export async function getGallery(galleryId: string) {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.id, galleryId)).limit(1)
    if (!gallery) return undefined

    const images = await db.select()
        .from(galleryImages)
        .where(eq(galleryImages.galleryId, galleryId))
        .orderBy(desc(galleryImages.createdAt))

    return {
        ...gallery,
        images: images
    }
}

// --- Image Management ---

export async function addImageToGallery(galleryId: string, data: z.infer<typeof ImageSchema>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const gallery = await db.query.galleries.findFirst({ where: eq(galleries.id, galleryId) })
        if (!gallery) return { success: false, error: "Gallery not found" }

        const hasAccess = await validateAdminAccess(session.user.id, gallery.organizationId)
        if (!hasAccess) return { success: false, error: "Insufficient permissions" }

        const validData = ImageSchema.parse(data)

        await db.insert(galleryImages).values({
            galleryId,
            imageUrl: validData.imageUrl,
            caption: validData.caption,
            order: 0,
        })

        revalidatePath(`/dashboard/admin/galleries/${galleryId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to add image" }
    }
}

export async function removeImage(imageId: string, galleryId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const gallery = await db.query.galleries.findFirst({ where: eq(galleries.id, galleryId) })
        if (!gallery) return { success: false, error: "Gallery not found" }

        const hasAccess = await validateAdminAccess(session.user.id, gallery.organizationId)
        if (!hasAccess) return { success: false, error: "Insufficient permissions" }

        await db.delete(galleryImages).where(eq(galleryImages.id, imageId))

        revalidatePath(`/dashboard/admin/galleries/${galleryId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to remove image" }
    }
}
