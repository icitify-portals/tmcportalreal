import { RoomServiceClient, TrackType } from "livekit-server-sdk"
import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { meetings, officials, systemSettings } from "@/lib/db/schema"

async function getLiveKitClient() {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, "INTEGRATION"))
    let apiKey = ""
    let apiSecret = ""
    let wsUrl = ""

    for (const setting of settings) {
        if (setting.settingKey === "livekit_api_key") apiKey = setting.settingValue || ""
        if (setting.settingKey === "livekit_api_secret") apiSecret = setting.settingValue || ""
        if (setting.settingKey === "livekit_url") wsUrl = setting.settingValue || ""
    }

    apiKey ||= process.env.LIVEKIT_API_KEY || ""
    apiSecret ||= process.env.LIVEKIT_API_SECRET || ""
    wsUrl ||= process.env.NEXT_PUBLIC_LIVEKIT_URL || ""

    if (!apiKey || !apiSecret || !wsUrl) return null

    return new RoomServiceClient(wsUrl.replace(/^ws/, "http"), apiKey, apiSecret)
}

async function getModeratorMeeting(room: string) {
    const session = await getServerSession()
    if (!session?.user?.id || !room) return null

    const [meeting] = await db.select({
        id: meetings.id,
        virtualRoomId: meetings.virtualRoomId,
        createdBy: meetings.createdBy,
        status: meetings.status,
    })
        .from(meetings)
        .where(and(eq(meetings.virtualRoomId, room), eq(meetings.status, "ONGOING")))
        .limit(1)

    if (!meeting) return null

    const [official] = await db.select({ userId: officials.userId })
        .from(officials)
        .where(eq(officials.userId, session.user.id))
        .limit(1)

    const isModerator = session.user.isSuperAdmin || meeting.createdBy === session.user.id || Boolean(official)
    return isModerator ? { meeting, userId: session.user.id } : null
}

export async function GET(request: NextRequest) {
    try {
        const room = request.nextUrl.searchParams.get("room") || ""
        const access = await getModeratorMeeting(room)
        if (!access) return NextResponse.json({ error: "Moderator access denied." }, { status: 403 })

        const client = await getLiveKitClient()
        if (!client) return NextResponse.json({ error: "LiveKit is not configured." }, { status: 500 })

        const participants = await client.listParticipants(room)
        return NextResponse.json({
            isModerator: true,
            participants: participants.map((participant) => ({
                identity: participant.identity,
                name: participant.name || participant.identity,
                isPublisher: participant.permission?.canPublish !== false,
            })),
        })
    } catch (error) {
        console.error("Error listing LiveKit participants:", error)
        return NextResponse.json({ error: "Unable to load meeting participants." }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { room?: string; identity?: string; action?: "mute" | "unmute" | "remove" }
        const room = body.room || ""
        const identity = body.identity || ""
        const action = body.action

        if (!identity || !action) return NextResponse.json({ error: "Participant and action are required." }, { status: 400 })

        const access = await getModeratorMeeting(room)
        if (!access) return NextResponse.json({ error: "Moderator access denied." }, { status: 403 })
        if (identity === access.userId) return NextResponse.json({ error: "You cannot moderate yourself." }, { status: 400 })

        const client = await getLiveKitClient()
        if (!client) return NextResponse.json({ error: "LiveKit is not configured." }, { status: 500 })

        if (action === "remove") {
            await client.removeParticipant(room, identity)
        } else {
            const participant = await client.getParticipant(room, identity)
            const muted = action === "mute"
            for (const track of participant.tracks) {
                if (track.sid && (track.type === TrackType.AUDIO || track.type === TrackType.VIDEO)) {
                    await client.mutePublishedTrack(room, identity, track.sid, muted)
                }
            }
            await client.updateParticipant(room, identity, {
                permission: { canPublish: !muted },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error moderating LiveKit participant:", error)
        return NextResponse.json({ error: "Unable to apply moderation action." }, { status: 500 })
    }
}
