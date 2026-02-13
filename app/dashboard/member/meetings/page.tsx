export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getMeetings, getAvailableMembers } from "@/lib/actions/meetings"
import { meetingAttendances, meetings } from "@/lib/db/schema"
import { db } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Video, Clock } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "@/lib/session"
import { format } from "date-fns"

async function MyMeetingsList() {
    const session = await getServerSession()
    if (!session?.user?.id) return null

    // Fetch invites
    const invites = await db.select({
        meeting: meetings,
        status: meetingAttendances.status
    })
        .from(meetingAttendances)
        .innerJoin(meetings, eq(meetingAttendances.meetingId, meetings.id))
        .where(eq(meetingAttendances.userId, session.user.id))
        .orderBy(desc(meetings.scheduledAt))

    if (invites.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg mt-8">
                <p className="text-muted-foreground">No meeting invites found.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {invites.map(({ meeting, status }) => (
                <Card key={meeting.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="line-clamp-2">{meeting.title}</CardTitle>
                            <Badge variant={status === 'PRESENT' ? 'default' : 'secondary'}>{status}</Badge>
                        </div>
                        <CardDescription>
                            <div className="flex items-center mt-2" suppressHydrationWarning>
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(new Date(meeting.scheduledAt), "PPP p")}
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {meeting.isOnline ? (
                            <div className="flex items-center text-sm"><Video className="mr-2 h-4 w-4" /> Online Meeting</div>
                        ) : (
                            <div className="flex items-center text-sm"><MapPin className="mr-2 h-4 w-4" /> {meeting.venue}</div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Link href={`/dashboard/member/meetings/${meeting.id}`} className="w-full">
                            <Button className="w-full">
                                {status === 'PRESENT' ? "Rejoin Room" : "Enter Meeting Room"}
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )

}

export default function MemberMeetingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">My Meetings</h2>
            <Suspense fallback={<div>Loading meetings...</div>}>
                <MyMeetingsList />
            </Suspense>
        </div>
    )
}

