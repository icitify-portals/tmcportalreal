export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getReports, approveReport, initializeDefaultOffices } from "@/lib/actions/reports"
import { getOffices } from "@/lib/actions/programmes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, FileText, Plus, Settings } from "lucide-react"
import { db } from "@/lib/db"
import { organizations, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReportSubmissionDialog } from "@/components/admin/reports/report-submission-dialog"

// Helper for status badge color
const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED': return 'bg-green-500'
        case 'SUBMITTED': return 'bg-blue-500'
        case 'REJECTED': return 'bg-red-500'
        case 'DRAFT': return 'bg-gray-500'
        default: return 'bg-gray-500'
    }
}

async function ReportList({ orgId, type }: { orgId: string, type: 'MY_REPORTS' | 'APPROVALS' }) {
    const reports = await getReports({
        organizationId: type === 'MY_REPORTS' ? orgId : undefined,
        status: type === 'APPROVALS' ? 'SUBMITTED' : undefined
    })

    if (reports.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                No reports found.
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {reports.map((r) => (
                <Card key={r.id}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">{r.title}</CardTitle>
                                <CardDescription>
                                    {r.type.replace('_', ' ')} • Period: {r.period}
                                </CardDescription>
                            </div>
                            <Badge className={getStatusColor(r.status || "")}>{r.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Submitted by: {r.user?.name || "Unknown"}</span>
                            <span>{r.office?.name || "General"}</span>
                        </div>

                        {type === 'APPROVALS' && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                                <form action={async () => {
                                    "use server"
                                    await approveReport(r.id)
                                }}>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default async function ReportsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Logic to determine Organization ID
    let organizationId = session.user.officialOrganizationId

    if (!organizationId) {
        // 1. Check User Roles
        const userRolesList = await db.select({
            organizationId: userRoles.organizationId
        })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(
                and(
                    eq(userRoles.userId, session.user.id),
                    eq(userRoles.isActive, true)
                )
            )
            .limit(1)

        organizationId = userRolesList[0]?.organizationId
    }

    if (!organizationId) {
        // 2. Fallback to session broad org
        organizationId = session.user.organizationId
    }

    if (!organizationId) {
        // 3. Final Fallback: National Org
        const nationalOrg = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.level, 'NATIONAL'))
            .limit(1)

        organizationId = nationalOrg[0]?.id
    }

    if (!organizationId) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <AlertCircle className="h-12 w-12 text-yellow-500" />
                    <h2 className="text-xl font-semibold">Jurisdiction Not Found</h2>
                    <p className="text-muted-foreground">Please join an organization as an official to access reports.</p>
                </div>
            </DashboardLayout>
        )
    }

    const offices = await getOffices(organizationId)

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Activity Reports</h2>
                    <div className="flex items-center space-x-2">
                        {offices.length === 0 && (
                            <form action={async () => {
                                "use server"
                                await initializeDefaultOffices(organizationId)
                            }}>
                                <Button variant="outline" size="sm">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Setup Offices
                                </Button>
                            </form>
                        )}
                        <ReportSubmissionDialog organizationId={organizationId} offices={offices} />
                    </div>
                </div>

                <Tabs defaultValue="my-reports" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                        {(session.user.isSuperAdmin || session.user.officialLevel === 'NATIONAL' || session.user.officialLevel === 'STATE') && (
                            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="my-reports" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ReportList type="MY_REPORTS" orgId={organizationId} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="approvals" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ReportList type="APPROVALS" orgId={organizationId} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
