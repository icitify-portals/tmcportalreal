import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import { contestCalls, systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const room = req.nextUrl.searchParams.get("room");

    if (!room) return NextResponse.json({ error: "Missing room" }, { status: 400 });

    const [call] = await db.select().from(contestCalls).where(eq(contestCalls.liveRoomId, room)).limit(1);
    if (!call) return NextResponse.json({ error: "Contest call room not found" }, { status: 404 });
    if (call.status !== "CALLED") return NextResponse.json({ error: "This participant has not been called yet" }, { status: 403 });

    let identity = session?.user?.id || `guest-${Math.random().toString(36).substring(2, 9)}`;
    let name = session?.user?.name || "Participant (Guest)";

    const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, "INTEGRATION"));
    let dbApiKey = "", dbApiSecret = "", dbWsUrl = "";
    settings.forEach((s) => {
      if (s.settingKey === "livekit_url") dbWsUrl = s.settingValue || "";
      if (s.settingKey === "livekit_api_key") dbApiKey = s.settingValue || "";
      if (s.settingKey === "livekit_api_secret") dbApiSecret = s.settingValue || "";
    });
    const apiKey = dbApiKey || process.env.LIVEKIT_API_KEY;
    const apiSecret = dbApiSecret || process.env.LIVEKIT_API_SECRET;
    const wsUrl = dbWsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });

    const at = new AccessToken(apiKey, apiSecret, { identity, name });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
    return NextResponse.json({ token: await at.toJwt(), wsUrl });
  } catch (e: any) {
    console.error("Contest LiveKit error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
