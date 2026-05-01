import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { programmes, programmeRegistrations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ registrationId: string }> }
) {
    try {
        const { registrationId } = await params

        // 1. Fetch the registration and linked programme
        const [reg] = await db.select({
            id: programmeRegistrations.id,
            status: programmeRegistrations.status,
            checkInTime: programmeRegistrations.checkInTime,
            meetingUrl: programmes.meetingUrl
        })
        .from(programmeRegistrations)
        .innerJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .where(eq(programmeRegistrations.id, registrationId))

        if (!reg) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 })
        }

        // 2. Mark as checked in and status = 'ATTENDED' if not already checked in
        if (!reg.checkInTime) {
            await db.update(programmeRegistrations).set({
                checkInTime: new Date(),
                status: 'ATTENDED',
                checkInBy: 'VIRTUAL_SELF'
            }).where(eq(programmeRegistrations.id, registrationId))
        }

        // 3. Fallback URL if no meeting URL is provided
        const redirectUrl = reg.meetingUrl || "/dashboard/member/programmes"

        return NextResponse.redirect(new URL(redirectUrl, request.url))
    } catch (error) {
        console.error("Error in virtual join:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
