"use server"

import { db } from "@/lib/db"
import { meetings, meetingAttendances, meetingDocs, users, organizations, officials, meetingGroups, meetingGroupMembers, notifications } from "@/lib/db/schema"
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { sendEmail, emailTemplates } from "@/lib/email"

// Schemas
const CreateMeetingSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    organizationId: z.string(),
    groupId: z.string().optional(), // Link to a predefined group
    scheduledAt: z.string(), // ISO String
    endAt: z.string().optional(),
    venue: z.string().optional(),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()), // Additional manual invites
    previousMinutesUrl: z.string().optional(),
})

export async function createMeeting(data: z.infer<typeof CreateMeetingSchema>) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Validation: Check if user is Admin, Secretary or ICTO (TODO: RBAC check)

    let virtualRoomId = undefined;
    if (data.isOnline) {
        virtualRoomId = `room-${crypto.randomUUID()}`;
    }

    const [meeting] = await db.insert(meetings).values({
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        groupId: data.groupId,
        scheduledAt: new Date(data.scheduledAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        venue: data.venue,
        isOnline: data.isOnline,
        meetingLink: data.meetingLink,
        virtualRoomId: virtualRoomId, // Assign randomly generated room ID for LiveKit
        status: 'SCHEDULED',
        createdBy: session.user.id
    }).$returningId()

    // 0. Handle Previous Minutes if provided
    if (data.previousMinutesUrl) {
        await db.insert(meetingDocs).values({
            meetingId: meeting.id,
            userId: session.user.id,
            title: "Previous Meeting Minutes",
            url: data.previousMinutesUrl,
            type: 'MINUTES'
        })
    }

    // 1. Auto-invite all Officials in this Jurisdiction
    const jurisdictionOfficials = await db.select({ userId: officials.userId })
        .from(officials)
        .where(eq(officials.organizationId, data.organizationId))

    const officialUserIds = jurisdictionOfficials.map(o => o.userId)

    // 2. Add Group Members if group selected
    let groupUserIds: string[] = []
    if (data.groupId) {
        const groupMembers = await db.select({ userId: meetingGroupMembers.userId })
            .from(meetingGroupMembers)
            .where(eq(meetingGroupMembers.groupId, data.groupId))
        groupUserIds = groupMembers.map(m => m.userId)
    }

    // Combine all unique invitees
    const allInvitees = Array.from(new Set([
        ...officialUserIds,
        ...groupUserIds,
        ...data.attendees
    ]))

    // Bulk insert invites
    if (allInvitees.length > 0) {
        await db.insert(meetingAttendances).values(
            allInvitees.map(userId => ({
                meetingId: meeting.id,
                userId: userId,
                status: 'INVITED' as const
            }))
        )

        // Send In-App Notifications
        await db.insert(notifications).values(
            allInvitees.map(userId => ({
                userId: userId,
                title: "Meeting Invitation",
                message: `You have been invited to: ${data.title} scheduled for ${format(new Date(data.scheduledAt), "PPP p")}${data.previousMinutesUrl ? " (Previous minutes attached)" : ""}`,
                type: 'INFO' as const,
                actionUrl: `/dashboard/member/meetings/${meeting.id}`
            }))
        )

        // Fetch user details for emails
        const inviteesInfo = await db.select({ name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, allInvitees))

        const meetingUrl = `${process.env.NEXTAUTH_URL}/dashboard/member/meetings/${meeting.id}`
        const scheduledDate = format(new Date(data.scheduledAt), "PPP p")

        // Send Emails (Asynchronous)
        Promise.all(inviteesInfo.map(user => {
            if (!user.email) return Promise.resolve();
            const template = emailTemplates.meetingInvitation(
                user.name || "Member",
                data.title + (data.previousMinutesUrl ? " (Minutes attached)" : ""),
                scheduledDate,
                data.venue || (data.isOnline ? "Online (Link in Dashboard)" : "Not specified"),
                meetingUrl
            )
            return sendEmail({
                to: user.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
                template: "meeting_invitation"
            })
        })).catch(err => console.error("Error sending meeting emails:", err))
    }

    revalidatePath(`/dashboard/admin/meetings`)
    return { success: true, meetingId: meeting.id }
}

export async function updateMeeting(id: string, data: z.infer<typeof CreateMeetingSchema>) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const [existingMeeting] = await db.select().from(meetings).where(eq(meetings.id, id))
    if (!existingMeeting) return { success: false, error: "Meeting not found" }

    let virtualRoomId = existingMeeting.virtualRoomId;
    if (data.isOnline && !virtualRoomId) {
        virtualRoomId = `room-${crypto.randomUUID()}`;
    } else if (!data.isOnline) {
        virtualRoomId = null;
    }

    await db.update(meetings).set({
        title: data.title,
        description: data.description,
        groupId: data.groupId,
        scheduledAt: new Date(data.scheduledAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        venue: data.venue,
        isOnline: data.isOnline,
        meetingLink: data.meetingLink,
        virtualRoomId: virtualRoomId,
    }).where(eq(meetings.id, id))

    const existingAttendances = await db.select().from(meetingAttendances).where(eq(meetingAttendances.meetingId, id))
    const existingUserIds = existingAttendances.map(a => a.userId)

    // Re-calculate who should be invited (Manual + Group + Officials)
    const jurisdictionOfficials = await db.select({ userId: officials.userId })
        .from(officials)
        .where(eq(officials.organizationId, data.organizationId))
    const officialUserIds = jurisdictionOfficials.map(o => o.userId)

    let groupUserIds: string[] = []
    if (data.groupId) {
        const groupMembers = await db.select({ userId: meetingGroupMembers.userId })
            .from(meetingGroupMembers)
            .where(eq(meetingGroupMembers.groupId, data.groupId))
        groupUserIds = groupMembers.map(m => m.userId)
    }

    const allNewRequiredInvitees = Array.from(new Set([
        ...officialUserIds,
        ...groupUserIds,
        ...data.attendees
    ]))

    const attendeesToRemove = existingUserIds.filter(userId => !allNewRequiredInvitees.includes(userId))
    const attendeesToAdd = allNewRequiredInvitees.filter(userId => !existingUserIds.includes(userId))

    if (attendeesToRemove.length > 0) {
        await db.delete(meetingAttendances).where(and(
            eq(meetingAttendances.meetingId, id),
            inArray(meetingAttendances.userId, attendeesToRemove)
        ))
    }

    if (attendeesToAdd.length > 0) {
        await db.insert(meetingAttendances).values(
            attendeesToAdd.map(userId => ({
                meetingId: id,
                userId: userId,
                status: 'INVITED' as const
            }))
        )
        // Notify only new ones
        await db.insert(notifications).values(
            attendeesToAdd.map(userId => ({
                userId: userId,
                title: "New Meeting Invitation",
                message: `You have been added to: ${data.title}`,
                type: 'INFO' as const,
                actionUrl: `/dashboard/member/meetings/${id}`
            }))
        )

        // Fetch user details for emails (new ones)
        const newInviteesInfo = await db.select({ name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, attendeesToAdd))

        const meetingUrl = `${process.env.NEXTAUTH_URL}/dashboard/member/meetings/${id}`
        const scheduledDate = format(new Date(data.scheduledAt), "PPP p")

        // Send Emails (Asynchronous)
        Promise.all(newInviteesInfo.map(user => {
            if (!user.email) return Promise.resolve();
            const template = emailTemplates.meetingInvitation(
                user.name || "Member",
                data.title,
                scheduledDate,
                data.venue || (data.isOnline ? "Online (Link in Dashboard)" : "Not specified"),
                meetingUrl
            )
            return sendEmail({
                to: user.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
                template: "meeting_invitation"
            })
        })).catch(err => console.error("Error sending updated meeting emails:", err))
    }

    revalidatePath(`/dashboard/admin/meetings`)
    revalidatePath(`/dashboard/admin/meetings/${id}`)
    return { success: true, meetingId: id }
}

export async function deleteMeeting(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Verify ownership or admin status if needed, for now we allow the user who knows the ID
    // (Assuming only admins get to the page where this is called)

    await db.delete(meetings).where(eq(meetings.id, id))
    // Dependents (attendance, docs) will be deleted via CASCADE if set in schema, 
    // but let's be explicit if not.
    await db.delete(meetingAttendances).where(eq(meetingAttendances.meetingId, id))
    await db.delete(meetingDocs).where(eq(meetingDocs.meetingId, id))

    revalidatePath("/dashboard/admin/meetings")
    return { success: true }
}

export async function startMeeting(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.update(meetings).set({
        status: 'ONGOING',
        updatedAt: new Date()
    }).where(eq(meetings.id, id))

    revalidatePath("/dashboard/admin/meetings")
    revalidatePath(`/dashboard/admin/meetings/${id}`)
    revalidatePath(`/dashboard/member/meetings/${id}`)
    return { success: true }
}

export async function endMeeting(id: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await db.update(meetings).set({
        status: 'ENDED',
        updatedAt: new Date()
    }).where(eq(meetings.id, id))

    revalidatePath("/dashboard/admin/meetings")
    revalidatePath(`/dashboard/admin/meetings/${id}`)
    revalidatePath(`/dashboard/member/meetings/${id}`)
    return { success: true }
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

    // Fetch existing attendance to check joinedAt
    const [attendance] = await db.select().from(meetingAttendances).where(and(
        eq(meetingAttendances.meetingId, meetingId),
        eq(meetingAttendances.userId, session.user.id)
    ))

    if (!attendance) {
        // Fallback: If they were never in the DB, add them now
        await db.insert(meetingAttendances).values({
            meetingId,
            userId: session.user.id,
            status: 'PRESENT',
            joinedAt: new Date()
        })
    } else {
        // Update attendance: preserve original joinedAt, clear leftAt
        await db.update(meetingAttendances).set({
            status: 'PRESENT',
            joinedAt: attendance.joinedAt || new Date(), // Only set if it was null
            leftAt: null // Clear any premature checkout
        }).where(and(
            eq(meetingAttendances.meetingId, meetingId),
            eq(meetingAttendances.userId, session.user.id)
        ))
    }

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
    const session = await getServerSession()
    if (!session?.user?.id) return []

    // 1. Get user's managed organizations (where they are an official)
    const userOfficials = await db.select().from(officials).where(eq(officials.userId, session.user.id))
    let orgIds = userOfficials.map(o => o.organizationId)

    // Fallback: If no official records, get all active organizations (assume admin context)
    if (orgIds.length === 0) {
        const activeOrgs = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.isActive, true))
        orgIds = activeOrgs.map(o => o.id)
    }

    if (orgIds.length === 0) return []

    // 2. Fetch unique users who are either officials or members in these organizations
    const officialsQuery = db.selectDistinct({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .innerJoin(officials, eq(users.id, officials.userId))
        .where(inArray(officials.organizationId, orgIds))

    const membersQuery = db.selectDistinct({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .innerJoin(members, eq(users.id, members.userId))
        .where(inArray(members.organizationId, orgIds))

    // Combined unique list
    const combined = await Promise.all([officialsQuery, membersQuery])
    const allUsers = [...combined[0], ...combined[1]]

    // De-duplicate by ID and sort
    return Array.from(new Map(allUsers.map(u => [u.id, u])).values())
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
}

import { members } from "@/lib/db/schema"

// --- Meeting Groups ---

export async function getMeetingGroups(organizationId: string) {
    const groups = await db.select().from(meetingGroups).where(eq(meetingGroups.organizationId, organizationId))
    if (groups.length === 0) return []

    const groupIds = groups.map(g => g.id)
    const membersList = await db.select().from(meetingGroupMembers).where(inArray(meetingGroupMembers.groupId, groupIds))

    return groups.map(g => ({
        ...g,
        memberCount: membersList.filter(m => m.groupId === g.id).length,
        members: membersList.filter(m => m.groupId === g.id)
    }))
}

export async function createMeetingGroup(name: string, organizationId: string, userIds: string[]) {
    const [group] = await db.insert(meetingGroups).values({
        name,
        organizationId
    }).$returningId()

    if (userIds.length > 0) {
        await db.insert(meetingGroupMembers).values(
            userIds.map(userId => ({
                groupId: group.id,
                userId
            }))
        )
    }

    return { success: true, groupId: group.id }
}

export async function updateMeetingGroup(id: string, name: string, userIds: string[]) {
    await db.update(meetingGroups).set({ name, updatedAt: new Date() }).where(eq(meetingGroups.id, id))

    // Replace members: Delete all existing then insert new
    await db.delete(meetingGroupMembers).where(eq(meetingGroupMembers.groupId, id))

    if (userIds.length > 0) {
        await db.insert(meetingGroupMembers).values(
            userIds.map(userId => ({
                groupId: id,
                userId
            }))
        )
    }

    return { success: true }
}

export async function deleteMeetingGroup(id: string) {
    await db.delete(meetingGroups).where(eq(meetingGroups.id, id))
    // Dependents (members) will be deleted via CASCADE
    return { success: true }
}

export async function getMeetingGroupWithMembers(id: string) {
    const [group] = await db.select().from(meetingGroups).where(eq(meetingGroups.id, id))
    if (!group) return null

    const members = await db.select().from(meetingGroupMembers).where(eq(meetingGroupMembers.groupId, id))
    return { ...group, members }
}

import { format } from "date-fns"
