"use server"

import { z } from "zod"
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { meetingActionItems, meetingAttendances, users } from "@/lib/db/schema"
import { getServerSession } from "@/lib/session"
import { getMeetingAccess } from "@/lib/actions/meeting-notes"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

const ActionItemSchema = z.object({
    meetingId: z.string().min(1),
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000).optional().nullable(),
    assignedTo: z.string().min(1).optional().nullable(),
    dueDate: z.string().optional().nullable(),
})

const ActionStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"])

async function getAuthorizedUser() {
    const session = await getServerSession()
    if (!session?.user?.id) return null
    return session
}

export async function getMeetingActionItems(meetingId: string) {
    const session = await getAuthorizedUser()
    if (!session) return []

    const access = await getMeetingAccess(meetingId, session.user.id, session.user.isSuperAdmin)
    if (!access.allowed) return []

    const rows = await db.select({
        item: meetingActionItems,
        assignee: users,
    })
        .from(meetingActionItems)
        .leftJoin(users, eq(meetingActionItems.assignedTo, users.id))
        .where(eq(meetingActionItems.meetingId, meetingId))
        .orderBy(asc(meetingActionItems.status), asc(meetingActionItems.dueDate), asc(meetingActionItems.createdAt))

    return rows.map((row) => ({ ...row.item, assignee: row.assignee }))
}

export async function createMeetingActionItem(data: z.infer<typeof ActionItemSchema>) {
    const session = await getAuthorizedUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const parsed = ActionItemSchema.parse(data)
    const access = await getMeetingAccess(parsed.meetingId, session.user.id, session.user.isSuperAdmin)
    if (!access.allowed) return { success: false, error: "You do not have access to this meeting" }

    if (parsed.assignedTo) {
        const [attendee] = await db.select({ id: meetingAttendances.id })
            .from(meetingAttendances)
            .where(and(
                eq(meetingAttendances.meetingId, parsed.meetingId),
                eq(meetingAttendances.userId, parsed.assignedTo),
            ))
            .limit(1)
        if (!attendee) return { success: false, error: "Assignee is not an attendee of this meeting" }
    }

    const id = uuidv4()
    await db.insert(meetingActionItems).values({
        id,
        meetingId: parsed.meetingId,
        title: parsed.title,
        description: parsed.description || null,
        assignedTo: parsed.assignedTo || null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        status: "OPEN",
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    revalidatePath(`/dashboard/meetings/${parsed.meetingId}/notes`)
    return { success: true, id }
}

export async function updateMeetingActionItemStatus(id: string, status: z.infer<typeof ActionStatusSchema>) {
    const session = await getAuthorizedUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const parsedStatus = ActionStatusSchema.parse(status)
    const [item] = await db.select().from(meetingActionItems).where(eq(meetingActionItems.id, id)).limit(1)
    if (!item) return { success: false, error: "Action item not found" }

    const access = await getMeetingAccess(item.meetingId, session.user.id, session.user.isSuperAdmin)
    if (!access.allowed) return { success: false, error: "You do not have access to this meeting" }

    await db.update(meetingActionItems)
        .set({
            status: parsedStatus,
            completedAt: parsedStatus === "COMPLETED" ? new Date() : null,
            updatedAt: new Date(),
        })
        .where(and(eq(meetingActionItems.id, id), eq(meetingActionItems.meetingId, item.meetingId)))

    revalidatePath(`/dashboard/meetings/${item.meetingId}/notes`)
    return { success: true }
}
