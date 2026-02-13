"use server"

import { db } from "@/lib/db"
import { meetings, meetingAttendances, meetingDocs, users, organizations } from "@/lib/db/schema"
import { eq, and, desc, asc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"

// Schemas
const CreateMeetingSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    organizationId: z.string(),
    scheduledAt: z.string(), // ISO String
    endAt: z.string().optional(),
    venue: z.string().optional(),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()), // User IDs
})

export async function createMeeting(data: z.infer<typeof CreateMeetingSchema>) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Validation: Check if user is Admin, Secretary or ICTO (TODO: RBAC check)

    const [meeting] = await db.insert(meetings).values({
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        scheduledAt: new Date(data.scheduledAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        venue: data.venue,
        isOnline: data.isOnline,
        meetingLink: data.meetingLink,
        status: 'SCHEDULED',
        createdBy: session.user.id
    }).$returningId()

    // Invites
    if (data.attendees.length > 0) {
        await db.insert(meetingAttendances).values(
            data.attendees.map(userId => ({
                meetingId: meeting.id,
                userId: userId,
                status: 'INVITED' as const
            }))
        )
        // TODO: Send Notifications
    }

    revalidatePath(`/dashboard/admin/meetings`)
    return { success: true, meetingId: meeting.id }
}

export async function getMeetings(organizationId?: string) {
    const session = await getServerSession()
    // If no OrgId passed, fetch from user scope. 
    // For now, list all if organizationId is passed or filter by user access

    let query = db.select().from(meetings).orderBy(desc(meetings.scheduledAt)).$dynamic()

    if (organizationId) {
        query = query.where(eq(meetings.organizationId, organizationId))
    }

    return await query
}

export async function getMeeting(id: string) {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id))
    if (!meeting) return null

    const attendees = await db.select({
        id: meetingAttendances.id,
        status: meetingAttendances.status,
        joinedAt: meetingAttendances.joinedAt,
        leftAt: meetingAttendances.leftAt,
        user: {
            id: users.id,
            name: users.name,
            email: users.email,
        }
    })
        .from(meetingAttendances)
        .leftJoin(users, eq(meetingAttendances.userId, users.id))
        .where(eq(meetingAttendances.meetingId, id))

    const docs = await db.select({
        id: meetingDocs.id,
        title: meetingDocs.title,
        url: meetingDocs.url,
        type: meetingDocs.type,
        submissionStatus: meetingDocs.submissionStatus,
        uploader: users.name,
        userId: meetingDocs.userId
    })
        .from(meetingDocs)
        .leftJoin(users, eq(meetingDocs.userId, users.id))
        .where(eq(meetingDocs.meetingId, id))

    return { ...meeting, attendees, docs }
}


// --- Attendance (Digital) ---

export async function joinMeeting(meetingId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Update attendance
    await db.update(meetingAttendances).set({
        status: 'PRESENT',
        joinedAt: new Date()
    }).where(and(
        eq(meetingAttendances.meetingId, meetingId),
        eq(meetingAttendances.userId, session.user.id)
    ))

    revalidatePath(`/dashboard/member/meetings/${meetingId}`)
    return { success: true }
}

export async function leaveMeeting(meetingId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.update(meetingAttendances).set({
        leftAt: new Date()
    }).where(and(
        eq(meetingAttendances.meetingId, meetingId),
        eq(meetingAttendances.userId, session.user.id)
    ))

    revalidatePath(`/dashboard/member/meetings/${meetingId}`)
    return { success: true }
}

// --- Reports ---

import { subDays, isAfter } from "date-fns"

export async function submitReport(meetingId: string, title: string, content: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId))
    if (!meeting) return { success: false, error: "Meeting not found" }

    const deadline = subDays(new Date(meeting.scheduledAt), 2)
    const isLate = isAfter(new Date(), deadline)

    await db.insert(meetingDocs).values({
        meetingId,
        userId: session.user.id,
        title,
        url: content, // Assuming URL
        type: 'MEMBER_REPORT',
        submissionStatus: isLate ? 'LATE' : 'ON_TIME'
    })

    revalidatePath(`/dashboard/member/meetings/${meetingId}`)
    return { success: true, isLate }
}

export async function uploadMinutes(meetingId: string, url: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.insert(meetingDocs).values({
        meetingId,
        userId: session.user.id,
        title: "Meeting Minutes",
        url,
        type: 'MINUTES'
    })
    // Notify attendees
    return { success: true }
}

export async function getAvailableMembers() {
    return await db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.name))
}
