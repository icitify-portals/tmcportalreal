export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { getMeeting, uploadMinutes } from "@/lib/actions/meetings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, differenceInMinutes } from "date-fns"
import { Button } from "@/components/ui/button"
import { UploadMinutesForm } from "@/components/meetings/upload-minutes-form" // Need to create this
import { DashboardLayout } from "@/components/layout/dashboard-layout"


interface AdminMeetingPageProps {
    params: Promise<{ id: string }>
}

export default async function AdminMeetingDetailPage({ params }: AdminMeetingPageProps) {
    const { id } = await params
    const meeting = await getMeeting(id)
    if (!meeting) return <div>Not found</div>

    const scheduledTime = new Date(meeting.scheduledAt)

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{meeting.title}</h2>
                        <p className="text-muted-foreground" suppressHydrationWarning>{format(scheduledTime, "PPP p")}</p>
                    </div>
                    <Badge>{meeting.status}</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Attendance & Punctuality Analysis</CardTitle>
                            <CardDescription>
                                Scheduled Start: <span suppressHydrationWarning>{format(scheduledTime, "p")}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined At</TableHead>
                                        <TableHead>Punctuality</TableHead>
                                        <TableHead>Reports Submitted</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {meeting.attendees.map(a => {
                                        if (!a.user) return null
                                        let punctuality = "N/A"
                                        let variant: "default" | "destructive" | "outline" | "secondary" = "outline"

                                        if (a.joinedAt) {
                                            const diff = differenceInMinutes(new Date(a.joinedAt), scheduledTime)
                                            if (diff <= 0) {
                                                punctuality = "On Time"
                                                variant = "default"
                                            } else {
                                                punctuality = `Late by ${diff} mins`
                                                variant = "destructive"
                                            }
                                        }

                                        const reports = meeting.docs.filter(d => d.userId === a.user?.id && d.type === 'MEMBER_REPORT')

                                        return (
                                            <TableRow key={a.id}>
                                                <TableCell>
                                                    <div className="font-medium">{a.user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                                                <TableCell suppressHydrationWarning>{a.joinedAt ? format(new Date(a.joinedAt), "p") : "-"}</TableCell>
                                                <TableCell>
                                                    {a.joinedAt && <Badge variant={variant}>{punctuality}</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    {reports.length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {reports.map(r => (
                                                                <div key={r.id} className="flex items-center gap-2">
                                                                    <a href={r.url} target="_blank" className="text-xs text-blue-600 underline">
                                                                        {r.title}
                                                                    </a>
                                                                    {(r as any).submissionStatus === 'LATE' && (
                                                                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">LATE</Badge>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Minutes</CardTitle>
                            <CardDescription>Upload minutes/report to send to members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UploadMinutesForm meetingId={meeting.id} />
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Existing Minutes:</h4>
                                {meeting.docs.filter(d => d.type === 'MINUTES').map(d => (
                                    <div key={d.id} className="text-sm">
                                        <a href={d.url} target="_blank" className="underline">{d.title}</a>
                                        <span className="text-xs text-muted-foreground ml-2">by {d.uploader}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
