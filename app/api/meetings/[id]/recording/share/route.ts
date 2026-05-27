import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "@/lib/session"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // TODO: Verify Admin rights

    try {
        const meetingId = params.id
        const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId))
        
        if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 })

        const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase()

        await db.update(meetings)
            .set({ recordingShareCode: shareCode })
            .where(eq(meetings.id, meetingId))

        return NextResponse.json({ success: true, shareCode })
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to generate code" }, { status: 500 })
    }
}
