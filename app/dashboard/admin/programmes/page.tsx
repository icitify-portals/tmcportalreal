export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getAdminProgrammes, approveProgrammeState, approveProgrammeNational } from "@/lib/actions/programmes"
import { CreateProgrammeDialog } from "@/components/admin/programmes/create-programme-dialog"
import { SubmitReportDialog } from "@/components/admin/programmes/submit-report-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { db } from "@/lib/db"
import { organizations, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


// Helper for status badge color
const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED': return 'bg-green-500'
        case 'PENDING_STATE': return 'bg-yellow-500'
        case 'PENDING_NATIONAL': return 'bg-orange-500'
        case 'REJECTED': return 'bg-red-500'
        case 'COMPLETED': return 'bg-blue-500'
        default: return 'bg-gray-500'
    }
}

async function ProgrammeList({ type, orgId }: { type: 'MY_PROGRAMMES' | 'TO_APPROVE', orgId: string }) {
    const programmes = await getAdminProgrammes(orgId, type) || []

    if (programmes.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                No programmes found.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {programmes.map((p) => (
                <Card key={p.id}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">{p.title}</CardTitle>
                                <CardDescription suppressHydrationWarning>{format(new Date(p.startDate), 'PPP')} @ {p.venue}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {p.isLateSubmission && (
                                    <Badge variant="destructive" className="animate-pulse">LATE</Badge>
                                )}
                                <Badge className={getStatusColor(p.status || "")}>{p.status?.replace('_', ' ')}</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
                        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                            <span>Target: {p.targetAudience}</span>
                            <span>{p.paymentRequired ? `₦${p.amount}` : "Free"}</span>
                        </div>

                        {/* Approval Actions */}
                        {type === 'TO_APPROVE' && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                                <form action={async () => {
                                    "use server"
                                    if (p.status === 'PENDING_STATE') await approveProgrammeState(p.id)
                                    if (p.status === 'PENDING_NATIONAL') await approveProgrammeNational(p.id)
                                }}>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Reporting Action */}
                        {type === 'MY_PROGRAMMES' && p.status === 'APPROVED' && (
                            <div className="mt-4 pt-4 border-t flex justify-end">
                                <SubmitReportDialog programmeId={p.id} programmeTitle={p.title} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default async function ProgrammesPage() {
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
                    <p className="text-muted-foreground text-center max-w-md">
                        Your account is not currently associated with an official jurisdiction.
                        Please contact the administrator or join an organization.
                    </p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Programmes</h2>
                    <div className="flex items-center space-x-2">
                        <CreateProgrammeDialog organizationId={organizationId} />
                    </div>
                </div>

                <Tabs defaultValue="my-programmes" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-programmes">My Programmes</TabsTrigger>
                        <TabsTrigger value="approvals">Approvals Required</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-programmes" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ProgrammeList type="MY_PROGRAMMES" orgId={organizationId} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="approvals" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ProgrammeList type="TO_APPROVE" orgId={organizationId} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

