export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { getMeetings, getAvailableMembers } from "@/lib/actions/meetings"
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Calendar, MapPin, Video } from "lucide-react"
import Link from "next/link"
import { getAvailableOrganizations } from "@/lib/actions/occasions"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


async function MeetingsList() {
    const meetings = await getMeetings()

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {meetings.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No meetings scheduled.
                        </TableCell>
                    </TableRow>
                ) : (
                    meetings.map((meeting) => (
                        <TableRow key={meeting.id}>
                            <TableCell suppressHydrationWarning>
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {format(new Date(meeting.scheduledAt), "PPP p")}
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{meeting.title}</TableCell>
                            <TableCell>
                                {meeting.isOnline ? (
                                    <div className="flex items-center"><Video className="mr-2 h-4 w-4" /> Online</div>
                                ) : (
                                    <div className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> {meeting.venue}</div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    meeting.status === 'SCHEDULED' ? 'outline' :
                                        meeting.status === 'ONGOING' ? 'default' :
                                            meeting.status === 'ENDED' ? 'secondary' : 'destructive'
                                }>
                                    {meeting.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/dashboard/admin/meetings/${meeting.id}`}>
                                        Manage
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}

export default async function AdminMeetingsPage() {
    const members = await getAvailableMembers()
    const orgs = await getAvailableOrganizations()
    // Default org ID - first one for now or handle selection in UI
    const defaultOrgId = orgs[0]?.id || ""

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
                    <CreateMeetingDialog members={members} currentOrgId={defaultOrgId} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Meetings</CardTitle>
                        <CardDescription>Manage organization meetings and invites.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div>Loading meetings...</div>}>
                            <MeetingsList />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
