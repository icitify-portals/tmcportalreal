import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { meetings, officials } from "@/lib/db/schema"

export async function getMeetingManagerAccess(meetingId: string, userId: string, isSuperAdmin = false) {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId)).limit(1)
    if (!meeting) return null

    if (isSuperAdmin || meeting.createdBy === userId) return meeting

    const [official] = await db.select({ userId: officials.userId })
        .from(officials)
        .where(and(eq(officials.userId, userId), eq(officials.isActive, true)))
        .limit(1)

    return official ? meeting : null
}
