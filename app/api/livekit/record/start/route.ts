import { NextRequest, NextResponse } from "next/server"
import { EgressClient, EncodedFileOutput, EncodedFileType } from "livekit-server-sdk"
import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { getLiveKitSettings, getStorageSettings } from "@/lib/actions/settings"

export async function POST(req: NextRequest) {
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { meetingId } = await req.json()
        if (!meetingId) return NextResponse.json({ error: "Meeting ID required" }, { status: 400 })

        const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId))
        if (!meeting || !meeting.virtualRoomId) {
            return NextResponse.json({ error: "Meeting room not found" }, { status: 404 })
        }

        const liveKitSettings = await getLiveKitSettings()
        const storageSettings = await getStorageSettings()

        if (!liveKitSettings.url || !liveKitSettings.apiKey || !liveKitSettings.apiSecret) {
            return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 })
        }
        if (!storageSettings.s3Bucket || !storageSettings.s3AccessKey) {
            return NextResponse.json({ error: "Storage settings not configured for recording" }, { status: 500 })
        }

        const egressClient = new EgressClient(
            liveKitSettings.url,
            liveKitSettings.apiKey,
            liveKitSettings.apiSecret
        )

        const fileOutput = new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `recordings/${meetingId}/meeting-{time}.mp4`,
            // @ts-ignore
            output: {
                case: 's3',
                value: {
                    accessKey: storageSettings.s3AccessKey,
                    secret: storageSettings.s3SecretKey,
                    bucket: storageSettings.s3Bucket,
                    region: storageSettings.s3Region,
                    endpoint: storageSettings.s3Endpoint || undefined,
                }
            }
        })

        const egress = await egressClient.startRoomCompositeEgress(
            meeting.virtualRoomId,
            { file: fileOutput },
            { layout: "speaker-dark" } // Options: speaker-dark, grid-dark, etc.
        )

        await db.update(meetings)
            .set({ egressId: egress.egressId })
            .where(eq(meetings.id, meeting.id))

        return NextResponse.json({ success: true, egressId: egress.egressId })
    } catch (error: any) {
        console.error("Failed to start recording:", error)
        return NextResponse.json({ error: error.message || "Failed to start recording" }, { status: 500 })
    }
}
