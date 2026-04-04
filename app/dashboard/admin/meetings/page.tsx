export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { getMeetings, getAvailableMembers } from "@/lib/actions/meetings"
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Video } from "lucide-react"
import Link from "next/link"
import { getAvailableOrganizations } from "@/lib/actions/occasions"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientDate } from "@/components/ui/client-date"

import { DeleteMeetingButton } from "@/components/meetings/delete-meeting-button"


async function MeetingsList({ orgId }: { orgId?: string }) {
    const meetings = await getMeetings(orgId)

    return (
        <div className="overflow-x-auto border rounded-md">
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
                                        <ClientDate date={meeting.scheduledAt} formatString="PPP p" />
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
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/admin/meetings/${meeting.id}`}>
                                                Manage
                                            </Link>
                                        </Button>
                                        <DeleteMeetingButton meetingId={meeting.id} meetingTitle={meeting.title} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMeetingGroups } from "@/lib/actions/meetings"
import { GroupsList } from "@/components/meetings/groups-list"
import { CreateMeetingGroupDialog } from "@/components/meetings/create-meeting-group-dialog"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrganizationSelector } from "@/components/admin/organization-selector"

export default async function AdminMeetingsPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const { orgId } = await searchParams
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    const members = await getAvailableMembers()
    const orgs = await getAvailableOrganizations()
    
    const isSuperAdmin = session.user.isSuperAdmin
    const selectedOrgId = orgId || (isSuperAdmin ? "" : session.user.organizationId || orgs[0]?.id || "")
    
    // Default org ID for UI if none selected yet
    const currentOrgId = selectedOrgId || orgs[0]?.id || ""

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6" suppressHydrationWarning>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Meetings & Groups</h2>
                        {isSuperAdmin && (
                            <p className="text-muted-foreground">Showing data for all or selected jurisdiction.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                            <OrganizationSelector currentOrgId={selectedOrgId} organizations={orgs} />
                        )}
                        <CreateMeetingGroupDialog availableMembers={members} currentOrgId={currentOrgId} isSuperAdmin={isSuperAdmin} />
                        <CreateMeetingDialog members={members} currentOrgId={currentOrgId} isSuperAdmin={isSuperAdmin} />
                    </div>
                </div>

                <Tabs defaultValue="meetings" className="space-y-4" suppressHydrationWarning>
                    <TabsList>
                        <TabsTrigger value="meetings">Scheduled Meetings</TabsTrigger>
                        <TabsTrigger value="groups">Meeting Groups</TabsTrigger>
                    </TabsList>
                    <TabsContent value="meetings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scheduled Meetings</CardTitle>
                                <CardDescription>Manage organization meetings and invites.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div>Loading meetings...</div>}>
                                    <MeetingsList orgId={selectedOrgId} />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="groups" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Meeting Groups</CardTitle>
                                <CardDescription>Manage reusable attendee groups for faster scheduling.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div>Loading groups...</div>}>
                                    <GroupsListWrapper orgId={selectedOrgId} availableMembers={members} />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

async function GroupsListWrapper({ orgId, availableMembers }: { orgId: string, availableMembers: any[] }) {
    const groups = await getMeetingGroups(orgId)
    return <GroupsList groups={groups} availableMembers={availableMembers} />
}
