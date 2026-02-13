export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { programmes, programmeReports } from "@/lib/db/schema"
import { eq, desc, isNotNull } from "drizzle-orm"
import { ReportViewModal } from "@/components/council/report-view-modal"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default async function CouncilReportsPage() {
    const session = await getServerSession()

    if (!session?.user) return redirect("/auth/signin")

    // NOTE: Logic to check if user is Council is already in layout/middleware, 
    // but good to have double check or just assume access if they got here via protected middleware.

    // Fetch programmes that represent "Events" and have a report submitted
    // We join programmes with programmeReports

    const reportedEvents = await db.select({
        programme: programmes,
        report: programmeReports
    })
        .from(programmes)
        .innerJoin(programmeReports, eq(programmes.id, programmeReports.programmeId))
        .orderBy(desc(programmeReports.submittedAt))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Event Reports</CardTitle>
                        <CardDescription>
                            Browse submitted reports for events across the organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Venue</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportedEvents.length > 0 ? (
                                    reportedEvents.map(({ programme, report }) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{programme.title}</TableCell>
                                            <TableCell>
                                                {programme.startDate ? format(programme.startDate, 'PPP') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{programme.venue}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{programme.level}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ReportViewModal report={report} programme={programme} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No reports found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
