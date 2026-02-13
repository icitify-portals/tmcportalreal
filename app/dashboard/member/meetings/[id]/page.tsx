export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getMeeting, joinMeeting, leaveMeeting, submitReport } from "@/lib/actions/meetings"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { format, subDays, isAfter } from "date-fns"
import { MeetingRoomActions } from "@/components/meetings/meeting-room-actions" // Client component for Join/Leave
import { MeetingReportForm } from "@/components/meetings/meeting-report-form" // Client component for upload

interface MeetingRoomPageProps {
    params: Promise<{ id: string }>
}

export default async function MeetingRoomPage({ params }: MeetingRoomPageProps) {
    const { id: meetingId } = await params
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/auth/signin")

    const meeting = await getMeeting(meetingId)
    if (!meeting) return <div>Meeting not found</div>

    const userAttendance = meeting.attendees.find(a => a.user?.id === session.user.id)
    const isPresent = userAttendance?.status === 'PRESENT'
    const minutes = meeting.docs.filter(d => d.type === 'MINUTES')
    const myReports = meeting.docs.filter(d => d.type === 'MEMBER_REPORT' && d.uploader === session.user.name)

    const deadline = subDays(new Date(meeting.scheduledAt), 2)
    const isDeadlinePassed = isAfter(new Date(), deadline)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{meeting.title}</h2>
                    <p className="text-muted-foreground">Scheduled for {format(new Date(meeting.scheduledAt), "PPP p")}</p>
                </div>
                <Badge variant={
                    meeting.status === 'ONGOING' ? 'default' :
                        meeting.status === 'SCHEDULED' ? 'outline' : 'secondary'
                }>
                    {meeting.status}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Digital Attendance</CardTitle>
                        <CardDescription>Mark your presence for punctuality analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MeetingRoomActions
                            meetingId={meeting.id}
                            isPresent={isPresent}
                            joinedAt={userAttendance?.joinedAt}
                            leftAt={userAttendance?.leftAt}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Meeting Resources</CardTitle>
                        <CardDescription>Minutes and Agenda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {minutes.length > 0 ? (
                            <ul className="space-y-2">
                                {minutes.map(doc => (
                                    <li key={doc.id} className="flex justify-between items-center border p-2 rounded">
                                        <span>{doc.title}</span>
                                        <a href={doc.url} target="_blank" className="text-primary hover:underline text-sm">Download</a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No minutes uploaded yet.</p>
                        )}
                        {meeting.meetingLink && (
                            <div className="mt-4 pt-4 border-t">
                                <Label>Online Meeting Link</Label>
                                <a href={meeting.meetingLink} target="_blank" className="block text-blue-600 underline text-lg truncate">
                                    {meeting.meetingLink}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>My Reports</CardTitle>
                        <CardDescription>
                            Submit reports for your office/unit. <br />
                            <span className={isDeadlinePassed ? "text-red-600 font-bold" : "text-muted-foreground"}>
                                Deadline: {format(deadline, "PPP p")} {isDeadlinePassed && "(Submission will be marked LATE)"}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MeetingReportForm meetingId={meeting.id} />

                        {myReports.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2">Submitted Reports:</h4>
                                <ul className="space-y-1 text-sm">
                                    {myReports.map(r => (
                                        <li key={r.id} className="flex items-center gap-2">
                                            <span>{r.title} ({r.url})</span>
                                            {(r as any).submissionStatus === 'LATE' && (
                                                <Badge variant="destructive" className="h-4 px-1 text-[10px]">LATE</Badge>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
