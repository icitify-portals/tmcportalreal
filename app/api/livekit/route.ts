import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/session";
import { getLiveKitSettings } from "@/lib/actions/settings";
import { db } from "@/lib/db";
import { meetings, meetingAttendances, meetingGuestAttendances, systemSettings, officials } from "@/lib/db/schema";
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
        let isAdmin = false;
        if (session?.user?.id) {
            const userOfficials = await db.select().from(officials).where(eq(officials.userId, session.user.id));
            if (userOfficials.length > 0 || session.user.isSuperAdmin) {
                isAdmin = true;
            }
        }

        const matchingMeetings = await db.select({
            id: meetings.id,
            status: meetings.status,
            isLocked: meetings.isLocked,
            isInstantCall: meetings.isInstantCall,
            endAt: meetings.endAt,
            createdBy: meetings.createdBy
        })
        .from(meetings)
        .where(eq(meetings.virtualRoomId, room))

        if (!matchingMeetings || matchingMeetings.length === 0) {
            return NextResponse.json({ error: 'Meeting room not found.' }, { status: 404 });
        }

        const activeMeeting = matchingMeetings.find(m => m.status === 'ONGOING');

        if (!activeMeeting) {
            return NextResponse.json({ error: 'This meeting has not been started by the host yet.' }, { status: 403 });
        }

        const meeting = activeMeeting;

        if (meeting.isLocked && !isAdmin && session?.user?.id !== meeting.createdBy) {
            return NextResponse.json({ error: 'This meeting has been locked by the host.' }, { status: 403 });
        }

        // Expired instant calls must not issue new tokens
        if (meeting.isInstantCall && meeting.endAt && new Date(meeting.endAt).getTime() < Date.now()) {
            return NextResponse.json({ error: 'This instant call has expired.' }, { status: 403 });
        }

        if (session?.user?.id) {
            const [access] = await db.select({
                id: meetingAttendances.id,
                status: meetingAttendances.status
            })
                .from(meetingAttendances)
                .where(and(
                    eq(meetingAttendances.meetingId, meeting.id),
                    eq(meetingAttendances.userId, session.user.id)
                ));

            const isHost = session.user.id === meeting.createdBy;

            if (!isAdmin && !isHost && !access) {
                return NextResponse.json({ error: 'You are not invited to this meeting.' }, { status: 403 });
            }

            if (!isAdmin && !isHost && access && access.status === 'DECLINED') {
                return NextResponse.json({ error: 'You have declined this meeting invitation.' }, { status: 403 });
            }
        } else if (guestName) {
            identity = `guest-${Math.random().toString(36).substring(2, 9)}`;
            name = guestName + " (Guest)";
            // Log anonymous guest join for headcount (best-effort, never blocks joining)
            try {
                await db.insert(meetingGuestAttendances).values({
                    id: crypto.randomUUID(),
                    meetingId: meeting.id,
                    name: guestName.slice(0, 255),
                });
            } catch (logErr) {
                console.error("Failed to log guest attendance:", logErr);
            }
        } else {
            return NextResponse.json({ error: 'Unauthorized. Please login or provide your name to join as a guest.' }, { status: 401 });
        }
        // --- END SECURITY CHECK ---

        // Fetch settings directly from DB to allow Guest access and avoid Server Action exposure
        const settingsFromDb = await db.select().from(systemSettings).where(eq(systemSettings.category, "INTEGRATION"));
        let dbApiKey = "";
        let dbApiSecret = "";
        let dbWsUrl = "";

        settingsFromDb.forEach(s => {
            if (s.settingKey === "livekit_url") dbWsUrl = s.settingValue || "";
            if (s.settingKey === "livekit_api_key") dbApiKey = s.settingValue || "";
            if (s.settingKey === "livekit_api_secret") dbApiSecret = s.settingValue || "";
        });

        const apiKey = dbApiKey || process.env.LIVEKIT_API_KEY;
        const apiSecret = dbApiSecret || process.env.LIVEKIT_API_SECRET;
        const wsUrl = dbWsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            console.error("LiveKit misconfigured:", { apiKey: !!apiKey, apiSecret: !!apiSecret, wsUrl: !!wsUrl });
            return NextResponse.json({ error: 'LiveKit server misconfigured. Please configure API keys in System Settings.' }, { status: 500 });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: identity!,
            name: name,
        });

        at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: isAdmin });

        const token = await at.toJwt();

        return NextResponse.json({ token, wsUrl });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json({ error: 'Internal server error generating token' }, { status: 500 });
    }
}
