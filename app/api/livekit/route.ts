import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/session";
import { getLiveKitSettings } from "@/lib/actions/settings";
import { db } from "@/lib/db";
import { meetings, meetingAttendances } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const room = req.nextUrl.searchParams.get('room');
        const username = session.user.name || 'Anonymous User';

        if (!room) {
            return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
        }

        // --- SECURITY CHECK ---
        // Verify user is invited to this meeting (room is virtualRoomId)
        // AND verify the meeting is ONGOING
        const [access] = await db.select({
            id: meetings.id,
            status: meetings.status
        })
            .from(meetings)
            .innerJoin(meetingAttendances, eq(meetings.id, meetingAttendances.meetingId))
            .where(and(
                eq(meetings.virtualRoomId, room),
                eq(meetingAttendances.userId, session.user.id)
            ))

        if (!access) {
            return NextResponse.json({ error: 'You are not authorized to join this meeting.' }, { status: 403 });
        }

        if (access.status !== 'ONGOING') {
            return NextResponse.json({ error: 'Admin has not yet started the meeting. Kindly reach out.' }, { status: 403 });
        }
        // --- END SECURITY CHECK ---

        const liveKitSettings = await getLiveKitSettings();

        const apiKey = liveKitSettings.apiKey || process.env.LIVEKIT_API_KEY;
        const apiSecret = liveKitSettings.apiSecret || process.env.LIVEKIT_API_SECRET;
        const wsUrl = liveKitSettings.url || process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            console.error("LiveKit misconfigured:", { apiKey: !!apiKey, apiSecret: !!apiSecret, wsUrl: !!wsUrl });
            return NextResponse.json({ error: 'LiveKit server misconfigured. Please configure API keys in System Settings.' }, { status: 500 });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: session.user.id,
            name: username,
        });

        at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

        const token = await at.toJwt();

        return NextResponse.json({ token, wsUrl });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json({ error: 'Internal server error generating token' }, { status: 500 });
    }
}
