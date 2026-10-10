export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getAdminProgrammes, approveProgrammeState, approveProgrammeNational } from "@/lib/actions/programmes"
import { getMockJurisdiction } from "@/lib/mock-jurisdiction"
import { CreateProgrammeDialog } from "@/components/admin/programmes/create-programme-dialog"
import { QuickProgrammeDialog } from "@/components/admin/programmes/quick-programme-dialog"
import { SubmitReportDialog } from "@/components/admin/programmes/submit-report-dialog"
import { ReviewActions } from "@/components/admin/programmes/review-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, XCircle, UserCheck, BarChart3, MessageSquare, Video, CalendarDays, FileText, Users } from "lucide-react"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db } from "@/lib/db"
import { organizations, userRoles, roles, officials, offices } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProgrammeActions } from "@/components/admin/programmes/programme-actions"
import { ClientDate } from "@/components/ui/client-date"
import { ClientCurrency } from "@/components/ui/client-currency"


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

import { ProgrammesClientGrid } from "@/components/admin/programmes/programmes-client-grid"

async function ProgrammeList({ 
    type, 
    orgId,
    currentUserId,
    isSuperAdmin,
    userLevel,
    userOfficialId
}: { 
    type: 'MY_PROGRAMMES' | 'TO_APPROVE', 
    orgId: string,
    currentUserId: string,
    isSuperAdmin: boolean,
    userLevel: string,
    userOfficialId: string
}) {
    const programmes = await getAdminProgrammes(orgId, type) || []

    return (
        <ProgrammesClientGrid
            programmes={programmes}
            type={type}
            currentUserId={currentUserId}
            isSuperAdmin={isSuperAdmin}
            userLevel={userLevel}
            userOfficialId={userOfficialId}
        />
    )
}

export default async function ProgrammesPage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Logic to determine Organization ID and Admin Status
    const userRolesList = await db.select({
        organizationId: userRoles.organizationId,
        roleCode: roles.code
    })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
            and(
                eq(userRoles.userId, session!.user.id),
                eq(userRoles.isActive, true)
            )
        )

    const userOfficial = await db.select({ 
        id: officials.id, 
        organizationId: officials.organizationId,
        positionLevel: officials.positionLevel
    })
    .from(officials)
    .where(eq(officials.userId, session!.user.id))
    .limit(1)

    const userLevel = userOfficial[0]?.positionLevel || session!.user.officialLevel || ""
    const roleCodes = userRolesList.map(r => r.roleCode)
    const isSuperAdmin = session!.user.isSuperAdmin
    const isAdmin = isSuperAdmin || roleCodes.some(code => code.endsWith('_ADMIN'))
    const canApprove = isSuperAdmin || userLevel === 'NATIONAL' || userLevel === 'STATE'
    const mock = await getMockJurisdiction()

    let organizationId = ""

    if (isSuperAdmin && mock) {
        const mockOrg = await db.query.organizations.findFirst({
            where: (org, { and, eq }) => {
                const conds = [eq(org.level, mock.level as any)]
                if (mock.state) conds.push(eq(org.state, mock.state))
                if (mock.lga) conds.push(eq(org.city, mock.lga))
                return and(...conds)
            }
        })
        organizationId = mockOrg?.id || ""
    } else {
        organizationId = userOfficial[0]?.organizationId || session!.user.officialOrganizationId || userRolesList[0]?.organizationId || session!.user.organizationId || ""
    }

    if (!organizationId) {
        // 3. Final Fallback: National Org
        const nationalOrg = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.level, 'NATIONAL'))
            .limit(1)

        organizationId = nationalOrg[0]?.id
    }

    const userOfficialId = userOfficial[0]?.id
    
    let userOfficeId = ""
    if (userOfficial[0]?.organizationId) {
        const firstOffice = await db.select({ id: offices.id })
            .from(offices)
            .where(eq(offices.organizationId, userOfficial[0].organizationId))
            .limit(1)
        userOfficeId = firstOffice[0]?.id || ""
    }
    
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Programmes</h2>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <a href="/dashboard/admin/programmes/reports">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Cumulative Reports
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/dashboard/programmes/bulk">
                                <Users className="mr-2 h-4 w-4" />
                                Bulk Register
                            </a>
                        </Button>
                        {(isSuperAdmin || userLevel === 'NATIONAL') && (
                            <Button variant="outline" asChild>
                                <a href="/dashboard/admin/programmes/calendar">
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Monitor Submissions
                                </a>
                            </Button>
                        )}
                        {(isAdmin || isSuperAdmin || userLevel === 'NATIONAL') && (
                            <CreateProgrammeDialog 
                                organizationId={organizationId || ""} 
                                isSuperAdmin={isSuperAdmin}
                                userOfficialId={userOfficialId}
                                userOfficeId={userOfficeId}
                                userLevel={userOfficial[0]?.positionLevel || session.user.officialLevel}
                                triggerLabel="Record Past Activity"
                            />
                        )}
                        <CreateProgrammeDialog 
                            organizationId={organizationId || ""} 
                            isSuperAdmin={isSuperAdmin}
                            userOfficialId={userOfficialId}
                            userOfficeId={userOfficeId}
                            userLevel={userOfficial[0]?.positionLevel || session.user.officialLevel}
                        />
                        <QuickProgrammeDialog
                            type="REPETITIVE"
                            organizationId={organizationId || ""}
                            triggerLabel="Repetitive Programme"
                        />
                        <QuickProgrammeDialog
                            type="SPECIAL"
                            organizationId={organizationId || ""}
                            triggerLabel="Special Programme"
                        />
                    </div>
                </div>

                <Tabs defaultValue="my-programmes" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-programmes">My Programmes</TabsTrigger>
                        {canApprove && <TabsTrigger value="approvals">Approvals Required</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="my-programmes" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ProgrammeList 
                                type="MY_PROGRAMMES" 
                                orgId={organizationId || ""} 
                                currentUserId={session!.user.id}
                                isSuperAdmin={isSuperAdmin}
                                userLevel={userLevel}
                                userOfficialId={userOfficialId || ""}
                            />
                        </Suspense>
                    </TabsContent>
 
                    <TabsContent value="approvals" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ProgrammeList 
                                type="TO_APPROVE" 
                                orgId={organizationId || ""} 
                                currentUserId={session!.user.id}
                                isSuperAdmin={isSuperAdmin}
                                userLevel={userLevel}
                                userOfficialId={userOfficialId || ""}
                            />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

