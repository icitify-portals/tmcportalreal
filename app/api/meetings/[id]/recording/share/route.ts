import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { getMeetingManagerAccess } from "@/lib/meeting-access"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // TODO: Verify Admin rights

    try {
        const { id: meetingId } = await params
        const meeting = await getMeetingManagerAccess(meetingId, session.user.id, session.user.isSuperAdmin)
        if (!meeting) return NextResponse.json({ error: "Meeting not found or access denied" }, { status: 404 })
        if (!meeting.egressId && !meeting.recordingUrl) {
            return NextResponse.json({ error: "No completed recording is available" }, { status: 409 })
        }

        const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase()

        await db.update(meetings)
            .set({ recordingShareCode: shareCode })
            .where(eq(meetings.id, meetingId))

        return NextResponse.json({ success: true, shareCode })
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to generate code" }, { status: 500 })
    }
}
