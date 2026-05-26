import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MeetingAttendanceKiosk } from "@/components/admin/meetings/meeting-attendance-kiosk"

export default async function MeetingKioskPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1)
    if (!meeting) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
            <MeetingAttendanceKiosk meetingId={id} meetingTitle={meeting.title} />
        </div>
    )
}
