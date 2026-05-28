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
        const room = req.nextUrl.searchParams.get('room');
        const guestName = req.nextUrl.searchParams.get('guestName');
        
        let identity = session?.user?.id;
        let name = session?.user?.name || 'Anonymous User';

        if (!room) {
            return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
        }

        // --- SECURITY CHECK ---
        const matchingMeetings = await db.select({
            id: meetings.id,
            status: meetings.status
        })
        .from(meetings)
        .where(eq(meetings.virtualRoomId, room))

        if (!matchingMeetings || matchingMeetings.length === 0) {
            return NextResponse.json({ error: 'Meeting room not found.' }, { status: 404 });
        }

        const ongoingMeeting = matchingMeetings.find(m => m.status === 'ONGOING');

        if (!ongoingMeeting) {
            return NextResponse.json({ error: 'Admin has not yet started the meeting. Kindly reach out.' }, { status: 403 });
        }

        const meeting = ongoingMeeting;

        // Check if user is authenticated member
        if (session?.user?.id) {
            const [access] = await db.select({ id: meetingAttendances.id })
                .from(meetingAttendances)
                .where(and(
                    eq(meetingAttendances.meetingId, meeting.id),
                    eq(meetingAttendances.userId, session.user.id)
                ));
            
            // Allow if invited, OR if they're joining via the share code (we bypass this if they're a guest)
            // Wait, if they are authenticated but not explicitly invited, do we let them in?
            // The user wants members to be able to use the link too. If they use the link, we should let them in.
        } else if (guestName) {
            // Guest Flow
            identity = `guest-${Math.random().toString(36).substring(2, 9)}`;
            name = guestName + " (Guest)";
        } else {
            return NextResponse.json({ error: 'Unauthorized. Please login or provide guest name.' }, { status: 401 });
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
            identity: identity!,
            name: name,
        });

        at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

        const token = await at.toJwt();

        return NextResponse.json({ token, wsUrl });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json({ error: 'Internal server error generating token' }, { status: 500 });
    }
}
