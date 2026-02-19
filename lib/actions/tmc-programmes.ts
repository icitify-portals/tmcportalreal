"use server"

import { db } from "@/lib/db"
import { tmcProgrammes } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { requireAdmin } from "@/lib/rbac"

export async function getTmcProgrammes() {
    try {
        const data = await db
            .select()
            .from(tmcProgrammes)
            .where(eq(tmcProgrammes.isActive, true))
            .orderBy(asc(tmcProgrammes.order), asc(tmcProgrammes.title))
        return { success: true, data }
    } catch (error) {
        console.error("getTmcProgrammes error:", error)
        return { success: false, error: "Failed to fetch programmes" }
    }
}

export async function getAllTmcProgrammes() {
    try {
        const session = await getServerSession()
        requireAdmin(session)
        const data = await db
            .select()
            .from(tmcProgrammes)
            .orderBy(asc(tmcProgrammes.order), asc(tmcProgrammes.title))
        return { success: true, data }
    } catch (error) {
        console.error("getAllTmcProgrammes error:", error)
        return { success: false, error: "Failed to fetch programmes" }
    }
}

export async function createTmcProgramme(formData: {
    title: string
    description?: string
    iconName?: string
    category?: string
    order?: number
    isActive?: boolean
}) {
    try {
        const session = await getServerSession()
        requireAdmin(session)
        await db.insert(tmcProgrammes).values({
            title: formData.title,
            description: formData.description || null,
            iconName: formData.iconName || null,
            category: formData.category || null,
            order: formData.order ?? 0,
            isActive: formData.isActive ?? true,
        })
        revalidatePath("/our-programmes")
        revalidatePath("/dashboard/admin/tmc-programmes")
        return { success: true }
    } catch (error) {
        console.error("createTmcProgramme error:", error)
        return { success: false, error: "Failed to create programme" }
    }
}

export async function updateTmcProgramme(id: string, formData: {
    title?: string
    description?: string
    iconName?: string
    category?: string
    order?: number
    isActive?: boolean
}) {
    try {
        const session = await getServerSession()
        requireAdmin(session)
        await db.update(tmcProgrammes).set({
            ...(formData.title !== undefined && { title: formData.title }),
            ...(formData.description !== undefined && { description: formData.description }),
            ...(formData.iconName !== undefined && { iconName: formData.iconName }),
            ...(formData.category !== undefined && { category: formData.category }),
            ...(formData.order !== undefined && { order: formData.order }),
            ...(formData.isActive !== undefined && { isActive: formData.isActive }),
        }).where(eq(tmcProgrammes.id, id))
        revalidatePath("/our-programmes")
        revalidatePath("/dashboard/admin/tmc-programmes")
        return { success: true }
    } catch (error) {
        console.error("updateTmcProgramme error:", error)
        return { success: false, error: "Failed to update programme" }
    }
}

export async function deleteTmcProgramme(id: string) {
    try {
        const session = await getServerSession()
        requireAdmin(session)
        await db.delete(tmcProgrammes).where(eq(tmcProgrammes.id, id))
        revalidatePath("/our-programmes")
        revalidatePath("/dashboard/admin/tmc-programmes")
        return { success: true }
    } catch (error) {
        console.error("deleteTmcProgramme error:", error)
        return { success: false, error: "Failed to delete programme" }
    }
}

export async function toggleTmcProgrammeActive(id: string, isActive: boolean) {
    return updateTmcProgramme(id, { isActive })
}
