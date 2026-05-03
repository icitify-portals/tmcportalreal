"use server"

import { db } from "@/lib/db"
import { constitutions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

export async function createConstitutionDraft(title: string, content: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.insert(constitutions).values({
            title,
            content,
            status: "DRAFT",
            createdBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        revalidatePath("/dashboard/admin/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Create Constitution Draft Error:", error)
        return { success: false, error: error.message || "Failed to create constitution draft" }
    }
}

export async function updateConstitutionDraft(id: string, title: string, content: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(constitutions).set({
            title,
            content,
            updatedAt: new Date(),
        }).where(eq(constitutions.id, id))

        revalidatePath("/dashboard/admin/constitution")
        revalidatePath("/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Update Constitution Draft Error:", error)
        return { success: false, error: error.message || "Failed to update constitution draft" }
    }
}

export async function approveConstitutionDraft(id: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Start transaction to unapprove previous approved constitution, if any
        await db.transaction(async (tx) => {
            await tx.update(constitutions).set({
                status: "ARCHIVED",
                updatedAt: new Date(),
            }).where(eq(constitutions.status, "APPROVED"))

            await tx.update(constitutions).set({
                status: "APPROVED",
                updatedAt: new Date(),
            }).where(eq(constitutions.id, id))
        })

        revalidatePath("/dashboard/admin/constitution")
        revalidatePath("/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Approve Constitution Draft Error:", error)
        return { success: false, error: error.message || "Failed to approve constitution draft" }
    }
}

export async function deleteConstitutionDraft(id: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.delete(constitutions).where(eq(constitutions.id, id))

        revalidatePath("/dashboard/admin/constitution")
        revalidatePath("/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Delete Constitution Draft Error:", error)
        return { success: false, error: error.message || "Failed to delete constitution draft" }
    }
}

export async function getApprovedConstitution() {
    try {
        const [approved] = await db.select().from(constitutions)
            .where(eq(constitutions.status, "APPROVED"))
            .limit(1)
        return approved || null
    } catch (err) {
        console.error("Get Approved Constitution Error:", err)
        return null
    }
}

export async function getConstitutionDrafts() {
    try {
        return await db.select().from(constitutions)
            .orderBy(desc(constitutions.createdAt))
    } catch (err) {
        console.error("Get Constitution Drafts Error:", err)
        return []
    }
}
