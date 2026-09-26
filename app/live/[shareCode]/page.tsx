import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { GuestJoinForm } from "@/components/meetings/guest-join-form"
import { getServerSession } from "@/lib/session"

export default async function LiveMeetingPublicPage({ params }: { params: Promise<{ shareCode: string }> }) {
    const { shareCode } = await params
    const matchingMeetings = await db.query.meetings.findMany({
        where: eq(meetings.shareCode, shareCode)
    })

    if (!matchingMeetings || matchingMeetings.length === 0) {
        return notFound()
    }

    let meeting = matchingMeetings.find(m => m.status === 'ONGOING')
    if (!meeting) {
        // Find the closest scheduled meeting
        const scheduled = matchingMeetings.filter(m => m.status === 'SCHEDULED')
        if (scheduled.length > 0) {
            scheduled.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            meeting = scheduled[0]
        } else {
            meeting = matchingMeetings[0] // Fallback
        }
    }

    const session = await getServerSession()

    const isPhysicalMeeting = !meeting.isOnline || !meeting.virtualRoomId

    const canBypassLock = !!session?.user && (
        session.user.isSuperAdmin ||
        !!session.user.officialLevel ||
        session.user.id === meeting.createdBy
    )

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

                    {isPhysicalMeeting ? (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-center border border-blue-200">
                            <strong>In-person meeting</strong>
                            <p className="mt-1 text-sm">
                                This meeting holds physically{meeting.venue ? ` at ${meeting.venue}` : ""}. There is no virtual room for this meeting — please attend in person.
                            </p>
                        </div>
                    ) : (
                    <>
                    {meeting.status === 'ENDED' && (
                        <div className="bg-gray-100 text-gray-700 p-4 rounded-md text-center border border-gray-200">
                            <strong>This meeting has ended</strong>
                            <p className="mt-1 text-sm">Thanks for your interest. Contact the host for the recording or minutes.</p>
                        </div>
                    )}

                    {meeting.status === 'CANCELLED' && (
                        <div className="bg-gray-100 text-gray-700 p-4 rounded-md text-center border border-gray-200">
                            <strong>This meeting has been cancelled</strong>
                            <p className="mt-1 text-sm">Please contact the host for further information.</p>
                        </div>
                    )}

                    {meeting.status !== 'ONGOING' && meeting.status !== 'ENDED' && meeting.status !== 'CANCELLED' && (
                        <div className="bg-amber-50 text-amber-700 p-4 rounded-md text-center border border-amber-200">
                            <strong>This meeting has not started yet</strong>
                            <p className="mt-1 text-sm">The host will start the meeting and the room will open for joining. Please check back shortly.</p>
                        </div>
                    )}

                    {meeting.status === 'ONGOING' && meeting.isLocked && !canBypassLock && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center border border-red-200">
                            <strong>Meeting Locked</strong>
                            <p className="mt-1 text-sm">This meeting has been locked by the host. New participants can no longer join.</p>
                        </div>
                    )}

                    {meeting.status === 'ONGOING' && (meeting.isLocked ? canBypassLock : true) && (
                        <GuestJoinForm 
                            virtualRoomId={meeting.virtualRoomId!} 
                            meetingTitle={meeting.title}
                            isLoggedIn={!!session?.user}
                            defaultName={session?.user?.name || ""}
                        />
                    )}
                    </>
                    )}
                </div>
            </div>
        </div>
    )
}
