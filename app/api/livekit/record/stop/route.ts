import { NextRequest, NextResponse } from "next/server"
import { EgressClient } from "livekit-server-sdk"
import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { getLiveKitSettings } from "@/lib/actions/settings"

export async function POST(req: NextRequest) {
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { meetingId } = await req.json()
        if (!meetingId) return NextResponse.json({ error: "Meeting ID required" }, { status: 400 })

        const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId))
        if (!meeting || !meeting.egressId) {
            return NextResponse.json({ error: "No active recording found" }, { status: 404 })
        }

        const liveKitSettings = await getLiveKitSettings()

        if (!liveKitSettings.url || !liveKitSettings.apiKey || !liveKitSettings.apiSecret) {
            return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 })
        }

        const egressClient = new EgressClient(
            liveKitSettings.url,
            liveKitSettings.apiKey,
            liveKitSettings.apiSecret
        )

        await egressClient.stopEgress(meeting.egressId)

        // We leave egressId on the meeting so we can query its final status if needed,
        // or we can null it out. But let's leave it to keep a record of the egress job.

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Failed to stop recording:", error)
        return NextResponse.json({ error: error.message || "Failed to stop recording" }, { status: 500 })
    }
}
