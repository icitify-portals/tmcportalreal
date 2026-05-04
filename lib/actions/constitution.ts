"use server"

import { db } from "@/lib/db"
import { constitutions, constitutionReviewers, constitutionFeedback, users } from "@/lib/db/schema"
import { eq, desc, and, like, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

export async function createConstitutionDraft(title: string, content: string, documentUrl?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.insert(constitutions).values({
            title,
            content,
            status: "DRAFT",
            documentUrl: documentUrl || null,
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

export async function updateConstitutionDraft(id: string, title: string, content: string, documentUrl?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(constitutions).set({
            title,
            content,
            documentUrl: documentUrl || null,
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

// ========== REVIEWERS ==========

export async function assignConstitutionReviewer(constitutionId: string, userId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Check if already assigned
        const [existing] = await db.select().from(constitutionReviewers)
            .where(and(
                eq(constitutionReviewers.constitutionId, constitutionId),
                eq(constitutionReviewers.userId, userId)
            ))
            .limit(1)

        if (existing) return { success: false, error: "User is already assigned as a reviewer." }

        await db.insert(constitutionReviewers).values({
            constitutionId,
            userId,
            assignedBy: session.user.id,
            assignedAt: new Date(),
        })

        revalidatePath("/dashboard/admin/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Assign Constitution Reviewer Error:", error)
        return { success: false, error: error.message || "Failed to assign reviewer" }
    }
}

export async function removeConstitutionReviewer(constitutionId: string, userId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.delete(constitutionReviewers)
            .where(and(
                eq(constitutionReviewers.constitutionId, constitutionId),
                eq(constitutionReviewers.userId, userId)
            ))

        revalidatePath("/dashboard/admin/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Remove Constitution Reviewer Error:", error)
        return { success: false, error: error.message || "Failed to remove reviewer" }
    }
}

export async function getConstitutionReviewers(constitutionId: string) {
    try {
        const reviewers = await db.select({
            id: constitutionReviewers.id,
            constitutionId: constitutionReviewers.constitutionId,
            userId: constitutionReviewers.userId,
            assignedAt: constitutionReviewers.assignedAt,
            assignedBy: constitutionReviewers.assignedBy,
            userName: users.name,
            userEmail: users.email,
            userImage: users.image,
        })
        .from(constitutionReviewers)
        .innerJoin(users, eq(constitutionReviewers.userId, users.id))
        .where(eq(constitutionReviewers.constitutionId, constitutionId))

        return reviewers
    } catch (err) {
        console.error("Get Constitution Reviewers Error:", err)
        return []
    }
}

// ========== FEEDBACK ==========

export async function submitConstitutionFeedback(constitutionId: string, comment: string, section?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Verify the user is assigned as a reviewer OR is admin
        const [reviewer] = await db.select().from(constitutionReviewers)
            .where(and(
                eq(constitutionReviewers.constitutionId, constitutionId),
                eq(constitutionReviewers.userId, session.user.id)
            ))
            .limit(1)

        // Also allow the creator to comment
        const [draft] = await db.select().from(constitutions)
            .where(eq(constitutions.id, constitutionId))
            .limit(1)

        if (!reviewer && draft?.createdBy !== session.user.id) {
            return { success: false, error: "You are not authorized to provide feedback on this draft." }
        }

        await db.insert(constitutionFeedback).values({
            constitutionId,
            userId: session.user.id,
            comment,
            section: section || null,
            createdAt: new Date(),
        })

        revalidatePath("/dashboard/admin/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Submit Constitution Feedback Error:", error)
        return { success: false, error: error.message || "Failed to submit feedback" }
    }
}

export async function getConstitutionFeedback(constitutionId: string) {
    try {
        const feedback = await db.select({
            id: constitutionFeedback.id,
            constitutionId: constitutionFeedback.constitutionId,
            userId: constitutionFeedback.userId,
            comment: constitutionFeedback.comment,
            section: constitutionFeedback.section,
            createdAt: constitutionFeedback.createdAt,
            userName: users.name,
            userEmail: users.email,
            userImage: users.image,
        })
        .from(constitutionFeedback)
        .innerJoin(users, eq(constitutionFeedback.userId, users.id))
        .where(eq(constitutionFeedback.constitutionId, constitutionId))
        .orderBy(desc(constitutionFeedback.createdAt))

        return feedback
    } catch (err) {
        console.error("Get Constitution Feedback Error:", err)
        return []
    }
}

export async function deleteConstitutionFeedback(feedbackId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.delete(constitutionFeedback).where(eq(constitutionFeedback.id, feedbackId))

        revalidatePath("/dashboard/admin/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Delete Constitution Feedback Error:", error)
        return { success: false, error: error.message || "Failed to delete feedback" }
    }
}

// ========== REVIEWER DRAFTS (for reviewer dashboard) ==========

export async function getMyReviewAssignments() {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return []

        const assignments = await db.select({
            reviewerId: constitutionReviewers.id,
            constitutionId: constitutionReviewers.constitutionId,
            assignedAt: constitutionReviewers.assignedAt,
            title: constitutions.title,
            status: constitutions.status,
            documentUrl: constitutions.documentUrl,
            content: constitutions.content,
        })
        .from(constitutionReviewers)
        .innerJoin(constitutions, eq(constitutionReviewers.constitutionId, constitutions.id))
        .where(eq(constitutionReviewers.userId, session.user.id))

        return assignments
    } catch (err) {
        console.error("Get My Review Assignments Error:", err)
        return []
    }
}
