"use server"

import { db } from "@/lib/db"
import { constitutions, constitutionReviewers, constitutionFeedback, users, notifications, officials, members, organizations, meetings } from "@/lib/db/schema"
import { eq, desc, and, like, or, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { sendEmail } from "@/lib/email"

export async function createConstitutionDraft(title: string, content: string, documentUrl?: string, timelines?: any) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.insert(constitutions).values({
            title,
            content,
            status: "DRAFT",
            documentUrl: documentUrl || null,
            branchReviewStartDate: timelines?.branchReviewStartDate || null,
            branchReviewEndDate: timelines?.branchReviewEndDate || null,
            lgaReviewStartDate: timelines?.lgaReviewStartDate || null,
            lgaReviewEndDate: timelines?.lgaReviewEndDate || null,
            stateReviewStartDate: timelines?.stateReviewStartDate || null,
            stateReviewEndDate: timelines?.stateReviewEndDate || null,
            nationalReviewStartDate: timelines?.nationalReviewStartDate || null,
            nationalReviewEndDate: timelines?.nationalReviewEndDate || null,
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

export async function updateConstitutionDraft(id: string, title: string, content: string, documentUrl?: string, timelines?: any) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(constitutions).set({
            title,
            content,
            documentUrl: documentUrl || null,
            branchReviewStartDate: timelines?.branchReviewStartDate !== undefined ? timelines.branchReviewStartDate : undefined,
            branchReviewEndDate: timelines?.branchReviewEndDate !== undefined ? timelines.branchReviewEndDate : undefined,
            lgaReviewStartDate: timelines?.lgaReviewStartDate !== undefined ? timelines.lgaReviewStartDate : undefined,
            lgaReviewEndDate: timelines?.lgaReviewEndDate !== undefined ? timelines.lgaReviewEndDate : undefined,
            stateReviewStartDate: timelines?.stateReviewStartDate !== undefined ? timelines.stateReviewStartDate : undefined,
            stateReviewEndDate: timelines?.stateReviewEndDate !== undefined ? timelines.stateReviewEndDate : undefined,
            nationalReviewStartDate: timelines?.nationalReviewStartDate !== undefined ? timelines.nationalReviewStartDate : undefined,
            nationalReviewEndDate: timelines?.nationalReviewEndDate !== undefined ? timelines.nationalReviewEndDate : undefined,
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

export async function advanceConstitutionStage(id: string, newStatus: string, workshopDate?: string | Date) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(constitutions).set({
            status: newStatus,
            updatedAt: new Date(),
        }).where(eq(constitutions.id, id))

        // Get the draft to extract the title
        const [draft] = await db.select({ title: constitutions.title }).from(constitutions).where(eq(constitutions.id, id)).limit(1)
        const draftTitle = draft ? draft.title : "Constitution Draft"

        try {
            let targetLevel: "NATIONAL" | "STATE" | "LOCAL_GOVERNMENT" | "BRANCH" | null = null;
            if (newStatus === 'REVIEW_BRANCH') targetLevel = 'BRANCH';
            else if (newStatus === 'REVIEW_LGA') targetLevel = 'LOCAL_GOVERNMENT';
            else if (newStatus === 'REVIEW_STATE') targetLevel = 'STATE';
            else if (newStatus === 'REVIEW_NATIONAL') targetLevel = 'NATIONAL';

            if (targetLevel) {
                // Notify officials at this level
                const targetOfficials = await db.select({ userId: officials.userId }).from(officials).where(eq(officials.positionLevel, targetLevel))
                const notifyUserIds = targetOfficials.map(o => o.userId)

                if (notifyUserIds.length > 0) {
                    await db.insert(notifications).values(
                        notifyUserIds.map(userId => ({
                            userId: userId,
                            title: "Constitution Review Stage Opened",
                            message: `The constitution draft "${draftTitle}" is now open for ${targetLevel.replace("_", " ")} review. Please submit your observations.`,
                            type: 'INFO' as const,
                            actionUrl: `/dashboard/official/constitution`,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }))
                    )

                    const inviteesInfo = await db.select({ name: users.name, email: users.email }).from(users).where(inArray(users.id, notifyUserIds))
                    Promise.all(inviteesInfo.map(user => {
                        if (!user.email) return Promise.resolve();
                        return sendEmail({
                            to: user.email,
                            subject: `Constitution Review: ${targetLevel.replace("_", " ")} Phase`,
                            html: `Hello ${user.name || 'Official'},<br/><br/>The constitution draft <b>${draftTitle}</b> is now open for ${targetLevel.replace("_", " ")} review.<br/><br/>Please log in to your official dashboard to read the draft and submit your observations.`,
                            text: `The constitution draft ${draftTitle} is now open for ${targetLevel.replace("_", " ")} review.`,
                            template: "general_notification"
                        })
                    })).catch(err => console.error("Error sending constitution emails:", err))
                }
            } else if (newStatus.endsWith('_WORKSHOP')) {
                const workshopLevel = newStatus.replace('_WORKSHOP', '');
                
                // Find a default organization (National level) to attach the meeting to
                const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1)

                let scheduledMeetingTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days from now
                if (workshopDate) {
                    scheduledMeetingTime = new Date(workshopDate);
                }

                if (nationalOrg) {
                    await db.insert(meetings).values({
                        title: `${draftTitle} - ${workshopLevel} Harmonisation Workshop`,
                        description: `Automated virtual workshop for harmonising constitution feedback at the ${workshopLevel} level.`,
                        organizationId: nationalOrg.id,
                        scheduledAt: scheduledMeetingTime,
                        isOnline: true,
                        createdBy: session.user.id,
                        status: 'SCHEDULED',
                    })
                }

                // Notify ALL users
                const allUsersList = await db.select({ userId: users.id, name: users.name, email: users.email }).from(users)
                if (allUsersList.length > 0) {
                    const chunkSize = 500;
                    for (let i = 0; i < allUsersList.length; i += chunkSize) {
                        const chunk = allUsersList.slice(i, i + chunkSize);
                        await db.insert(notifications).values(
                            chunk.map(user => ({
                                userId: user.userId,
                                title: "Constitution Workshop Scheduled",
                                message: `A virtual harmonisation workshop has been scheduled for the constitution "${draftTitle}" at the ${workshopLevel} level.`,
                                type: 'INFO' as const,
                                actionUrl: `/dashboard/member/meetings`,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }))
                        )
                    }
                }
            } else if (newStatus === 'APPROVED') {
                // Notify ALL users
                const allUsersList = await db.select({ userId: users.id, name: users.name, email: users.email }).from(users)
                if (allUsersList.length > 0) {
                    // Chunk inserts because it might be too large
                    const chunkSize = 500;
                    for (let i = 0; i < allUsersList.length; i += chunkSize) {
                        const chunk = allUsersList.slice(i, i + chunkSize);
                        await db.insert(notifications).values(
                            chunk.map(user => ({
                                userId: user.userId,
                                title: "Constitution Approved",
                                message: `A new constitution "${draftTitle}" has been officially approved and published!`,
                                type: 'SUCCESS' as const,
                                actionUrl: `/constitution`,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }))
                        )
                        
                        Promise.all(chunk.map(user => {
                            if (!user.email) return Promise.resolve();
                            return sendEmail({
                                to: user.email,
                                subject: `New Constitution Published: ${draftTitle}`,
                                html: `Hello ${user.name || 'Member'},<br/><br/>The constitution draft <b>${draftTitle}</b> has been officially approved and published!<br/><br/>You can now view the full, active constitution in the portal.`,
                                text: `The constitution draft ${draftTitle} has been officially approved and published!`,
                                template: "general_notification"
                            })
                        })).catch(err => console.error("Error sending constitution approval emails:", err))
                    }
                }
            }
        } catch (notifyErr) {
            console.error("Constitution notification error:", notifyErr)
        }

        revalidatePath("/dashboard/admin/constitution")
        revalidatePath("/dashboard/official/constitution")
        return { success: true }
    } catch (error: any) {
        console.error("Advance Constitution Stage Error:", error)
        return { success: false, error: error.message || "Failed to advance constitution stage" }
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

        // Get draft title for the notification
        const [draft] = await db.select({ title: constitutions.title }).from(constitutions)
            .where(eq(constitutions.id, constitutionId)).limit(1)

        // Send in-app notification to the reviewer
        await db.insert(notifications).values({
            userId,
            title: "Constitution Review Assignment",
            message: `You have been assigned to review the constitution draft: "${draft?.title || 'Untitled'}". Please log in to the portal to review and provide your feedback.`,
            type: "INFO",
            actionUrl: "/dashboard/admin/constitution",
            createdAt: new Date(),
            updatedAt: new Date(),
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

export async function submitConstitutionFeedback(constitutionId: string, comment: string, section?: string, level: "MEMBER" | "LGA_COLLATION" | "STATE_COLLATION" | "NATIONAL_COLLATION" = "MEMBER") {
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

        let isAuthorized = false
        if (reviewer || draft?.createdBy === session.user.id) {
            isAuthorized = true
        } else if (draft) {
            // Check if user is an official at the matching org level
            let requiredLevel: "BRANCH" | "LOCAL_GOVERNMENT" | "STATE" | "NATIONAL" | null = null;
            if (draft.status === "REVIEW_BRANCH") requiredLevel = "BRANCH";
            if (draft.status === "REVIEW_LGA") requiredLevel = "LOCAL_GOVERNMENT";
            if (draft.status === "REVIEW_STATE") requiredLevel = "STATE";
            if (draft.status === "REVIEW_NATIONAL") requiredLevel = "NATIONAL";

            if (requiredLevel) {
                const [official] = await db.select().from(officials)
                    .where(and(
                        eq(officials.userId, session.user.id),
                        eq(officials.positionLevel, requiredLevel),
                        eq(officials.isActive, true)
                    ))
                    .limit(1)
                
                if (official) isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return { success: false, error: "You are not authorized to provide feedback on this draft at its current stage." }
        }

        const [member] = await db.select().from(members).where(eq(members.userId, session.user.id)).limit(1)
        const memberIdStr = member ? member.memberId : null

        let jurisdictionBranchId: string | null = null;
        let jurisdictionLgaId: string | null = null;
        let jurisdictionStateId: string | null = null;

        if (member?.organizationId) {
            jurisdictionBranchId = member.organizationId;
            const [branch] = await db.select().from(organizations).where(eq(organizations.id, member.organizationId)).limit(1);
            if (branch?.parentId) {
                jurisdictionLgaId = branch.parentId;
                const [lga] = await db.select().from(organizations).where(eq(organizations.id, branch.parentId)).limit(1);
                if (lga?.parentId) {
                    jurisdictionStateId = lga.parentId;
                }
            }
        }

        await db.insert(constitutionFeedback).values({
            constitutionId,
            userId: session.user.id,
            comment,
            section: section || null,
            level,
            memberId: memberIdStr,
            jurisdictionBranchId,
            jurisdictionLgaId,
            jurisdictionStateId,
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
            level: constitutionFeedback.level,
            memberId: constitutionFeedback.memberId,
            jurisdictionBranchId: constitutionFeedback.jurisdictionBranchId,
            jurisdictionLgaId: constitutionFeedback.jurisdictionLgaId,
            jurisdictionStateId: constitutionFeedback.jurisdictionStateId,
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

        // 2. Get active org-level drafts
        const activeOfficials = await db.select().from(officials)
            .where(and(
                eq(officials.userId, session.user.id),
                eq(officials.isActive, true)
            ))
        
        let matchingStatuses: string[] = []
        for (const off of activeOfficials) {
            if (off.positionLevel === "BRANCH") matchingStatuses.push("REVIEW_BRANCH")
            if (off.positionLevel === "LOCAL_GOVERNMENT") matchingStatuses.push("REVIEW_LGA")
            if (off.positionLevel === "STATE") matchingStatuses.push("REVIEW_STATE")
            if (off.positionLevel === "NATIONAL") matchingStatuses.push("REVIEW_NATIONAL")
        }

        let stageDrafts: any[] = []
        if (matchingStatuses.length > 0) {
             const drafts = await db.select().from(constitutions)
                .where(inArray(constitutions.status, matchingStatuses))
             
             // Format them to match the explicit assignment shape
             stageDrafts = drafts.map(d => ({
                 reviewerId: 'org-level-access',
                 constitutionId: d.id,
                 assignedAt: d.createdAt,
                 title: d.title,
                 status: d.status,
                 documentUrl: d.documentUrl,
                 content: d.content
             }))
        }

        // Merge and deduplicate by constitutionId
        const allDrafts = [...assignments, ...stageDrafts]
        const uniqueDrafts = Array.from(new Map(allDrafts.map(item => [item.constitutionId, item])).values())

        return uniqueDrafts
    } catch (err) {
        console.error("Get My Review Assignments Error:", err)
        return []
    }
}

export async function getAggregatedFeedback(constitutionId: string, levelFilter?: string, jurisdictionId?: string) {
    try {
        let query = db.select({
            id: constitutionFeedback.id,
            constitutionId: constitutionFeedback.constitutionId,
            userId: constitutionFeedback.userId,
            comment: constitutionFeedback.comment,
            section: constitutionFeedback.section,
            level: constitutionFeedback.level,
            memberId: constitutionFeedback.memberId,
            jurisdictionBranchId: constitutionFeedback.jurisdictionBranchId,
            jurisdictionLgaId: constitutionFeedback.jurisdictionLgaId,
            jurisdictionStateId: constitutionFeedback.jurisdictionStateId,
            createdAt: constitutionFeedback.createdAt,
            userName: users.name,
            userEmail: users.email,
        })
        .from(constitutionFeedback)
        .innerJoin(users, eq(constitutionFeedback.userId, users.id))
        
        let conditions: any[] = [eq(constitutionFeedback.constitutionId, constitutionId)]
        if (levelFilter) {
            conditions.push(eq(constitutionFeedback.level, levelFilter as any))
        }
        if (jurisdictionId) {
            conditions.push(or(
                eq(constitutionFeedback.jurisdictionBranchId, jurisdictionId),
                eq(constitutionFeedback.jurisdictionLgaId, jurisdictionId),
                eq(constitutionFeedback.jurisdictionStateId, jurisdictionId)
            ))
        }

        const results = await query.where(and(...conditions)).orderBy(desc(constitutionFeedback.createdAt))
        return results;
    } catch (err) {
        console.error("Get Aggregated Feedback Error:", err)
        return []
    }
}
