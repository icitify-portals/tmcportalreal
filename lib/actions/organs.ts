"use server"

import { db } from "@/lib/db"
import { organs } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { requireAdmin } from "@/lib/rbac"

// ── Public: fetch active organs ordered by display order ──────────────────────
export async function getOrgans() {
    try {
        const data = await db
            .select()
            .from(organs)
            .where(eq(organs.isActive, true))
            .orderBy(asc(organs.order), asc(organs.name))
        return { success: true, data }
    } catch (error) {
        console.error("getOrgans error:", error)
        return { success: false, error: "Failed to fetch organs" }
    }
}

// ── Admin: fetch ALL organs (including inactive) ───────────────────────────────
export async function getAllOrgans() {
    try {
        const session = await getServerSession()
        requireAdmin(session)
        const data = await db
            .select()
            .from(organs)
            .orderBy(asc(organs.order), asc(organs.name))
        return { success: true, data }
    } catch (error) {
        console.error("getAllOrgans error:", error)
        return { success: false, error: "Failed to fetch organs" }
    }
}

// ── Admin: create a new organ ─────────────────────────────────────────────────
export async function createOrgan(formData: {
    name: string
    description?: string
    websiteUrl?: string
    logoUrl?: string
    category?: string
    order?: number
    isActive?: boolean
}) {
    try {
        const session = await getServerSession()
        requireAdmin(session)

        await db.insert(organs).values({
            name: formData.name,
            description: formData.description || null,
            websiteUrl: formData.websiteUrl || null,
            logoUrl: formData.logoUrl || null,
            category: formData.category || null,
            order: formData.order ?? 0,
            isActive: formData.isActive ?? true,
        })

        revalidatePath("/organs")
        revalidatePath("/dashboard/admin/organs")
        return { success: true }
    } catch (error) {
        console.error("createOrgan error:", error)
        return { success: false, error: "Failed to create organ" }
    }
}

// ── Admin: update an organ ────────────────────────────────────────────────────
export async function updateOrgan(
    id: string,
    formData: {
        name?: string
        description?: string
        websiteUrl?: string
        logoUrl?: string
        category?: string
        order?: number
        isActive?: boolean
    }
) {
    try {
        const session = await getServerSession()
        requireAdmin(session)

        await db
            .update(organs)
            .set({
                ...(formData.name !== undefined && { name: formData.name }),
                ...(formData.description !== undefined && { description: formData.description }),
                ...(formData.websiteUrl !== undefined && { websiteUrl: formData.websiteUrl }),
                ...(formData.logoUrl !== undefined && { logoUrl: formData.logoUrl }),
                ...(formData.category !== undefined && { category: formData.category }),
                ...(formData.order !== undefined && { order: formData.order }),
                ...(formData.isActive !== undefined && { isActive: formData.isActive }),
            })
            .where(eq(organs.id, id))

        revalidatePath("/organs")
        revalidatePath("/dashboard/admin/organs")
        return { success: true }
    } catch (error) {
        console.error("updateOrgan error:", error)
        return { success: false, error: "Failed to update organ" }
    }
}

// ── Admin: delete an organ ────────────────────────────────────────────────────
export async function deleteOrgan(id: string) {
    try {
        const session = await getServerSession()
        requireAdmin(session)

        await db.delete(organs).where(eq(organs.id, id))

        revalidatePath("/organs")
        revalidatePath("/dashboard/admin/organs")
        return { success: true }
    } catch (error) {
        console.error("deleteOrgan error:", error)
        return { success: false, error: "Failed to delete organ" }
    }
}

// ── Admin: toggle isActive ────────────────────────────────────────────────────
export async function toggleOrganActive(id: string, isActive: boolean) {
    return updateOrgan(id, { isActive })
}
