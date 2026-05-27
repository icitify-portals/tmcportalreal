import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { GuestJoinForm } from "@/components/meetings/guest-join-form"
import { getServerSession } from "@/lib/session"

export default async function LiveMeetingPublicPage({ params }: { params: Promise<{ shareCode: string }> }) {
    const { shareCode } = await params
    const meeting = await db.query.meetings.findFirst({
        where: eq(meetings.shareCode, shareCode)
    })

    if (!meeting || !meeting.isOnline || !meeting.virtualRoomId) {
        return notFound()
    }

    const session = await getServerSession()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-3xl">🎥</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">{meeting.title}</h1>
                    <p className="text-center text-muted-foreground mb-8">
                        {meeting.description || "Join the live virtual room"}
                    </p>

                    <GuestJoinForm 
                        virtualRoomId={meeting.virtualRoomId} 
                        meetingTitle={meeting.title}
                        isLoggedIn={!!session?.user}
                        defaultName={session?.user?.name || ""}
                    />
                </div>
            </div>
        </div>
    )
}
