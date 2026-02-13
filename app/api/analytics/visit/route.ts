import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { siteVisits } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { visitorId, sessionId, path } = body
        const session = await getServerSession()
        const userAgent = request.headers.get("user-agent")

        // Try to get IP, handle localhost/dev scenarios
        const ip = request.headers.get("x-forwarded-for")?.split(',')[0] ||
            request.headers.get("x-real-ip") ||
            "127.0.0.1"

        await db.insert(siteVisits).values({
            visitorId,
            sessionId,
            path: path || "/",
            userId: session?.user?.id || null,
            userAgent: userAgent || "Unknown",
            ip: ip,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Analytics error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
