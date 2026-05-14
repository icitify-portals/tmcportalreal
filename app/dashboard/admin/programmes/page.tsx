export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getAdminProgrammes, approveProgrammeState, approveProgrammeNational } from "@/lib/actions/programmes"
import { getMockJurisdiction } from "@/lib/mock-jurisdiction"
import { CreateProgrammeDialog } from "@/components/admin/programmes/create-programme-dialog"
import { SubmitReportDialog } from "@/components/admin/programmes/submit-report-dialog"
import { ReviewActions } from "@/components/admin/programmes/review-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, XCircle, UserCheck, BarChart3, MessageSquare } from "lucide-react"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programmes.map((p) => (
                <div key={p.id} className="bg-[#031408] border border-green-800/30 shadow-xl rounded-2xl overflow-hidden hover:border-green-700/50 transition-all flex flex-col justify-between">
                    <div>
                        <div className="pb-3 bg-[#0c2413]/40 border-b border-green-800/20 p-5 flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white tracking-tight">{p.title}</h3>
                                <div className="text-green-300 font-medium text-sm mt-1">
                                    <ClientDate date={p.startDate} formatString="PPP" /> @ {p.venue}
                                </div>
                                {p.office && (
                                    <Badge variant="outline" className="mt-1 border-emerald-800 text-emerald-300 bg-emerald-950/60">
                                        {p.office.name}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {p.isLateSubmission && (
                                    <Badge variant="destructive" className="animate-pulse">LATE</Badge>
                                )}
                                <Badge className={`${getStatusColor(p.status || "")} text-white shadow-sm font-bold`}>
                                    {p.status?.replace('_', ' ')}
                                </Badge>
                                <ProgrammeActions programme={p} />
                            </div>
                        </div>
                        <div className="p-5 space-y-4 bg-[#031408]">
                            <p className="text-sm text-green-50/90 font-normal leading-relaxed">{p.description}</p>
                            
                            {p.status === 'REJECTED' && p.rejectionReason && (
                                <Alert variant="destructive" className="bg-red-950/40 border-red-900/60 text-red-100">
                                    <XCircle className="h-4 w-4 text-red-400" />
                                    <AlertTitle className="text-red-300 text-xs font-bold uppercase tracking-wider">Rejection Reason</AlertTitle>
                                    <AlertDescription className="text-red-200 text-sm font-medium">
                                        {p.rejectionReason}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-between items-center text-sm font-semibold text-green-200/80 pt-2">
                                <span>Target: {p.targetAudience}</span>
                                {p.paymentRequired ? (
                                    <ClientCurrency amount={p.amount || 0} className="text-emerald-400 font-bold" />
                                ) : (
                                    <span className="text-emerald-400 font-bold">Free</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-[#0c2413]/20 border-t border-green-800/10 flex flex-wrap gap-2 justify-between items-center mt-auto">
                        {/* Approval Actions */}
                        {type === 'TO_APPROVE' && (
                            <ReviewActions programmeId={p.id} status={p.status || ""} hasCertificate={p.hasCertificate ?? false} />
                        )}

                        {/* Reporting & Registration Actions */}
                        {type === 'MY_PROGRAMMES' && (p.status === 'APPROVED' || p.status === 'COMPLETED') && (
                            <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" size="sm" asChild className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors">
                                        <a href={`/dashboard/admin/programmes/${p.id}/registrations`}>
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Registrations
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors">
                                        <a href={`/dashboard/admin/programmes/${p.id}/analytics`}>
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Analytics
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="bg-green-950/60 hover:bg-green-900/80 border border-green-800/40 text-green-300 font-semibold px-3 py-1.5 text-xs rounded-lg transition-colors">
                                        <a href={`/dashboard/programmes/${p.id}/group`}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Lounge
                                        </a>
                                    </Button>
                                </div>
                                {(p.status === 'COMPLETED' || new Date(p.startDate) < new Date()) && (
                                    <SubmitReportDialog programmeId={p.id} programmeTitle={p.title} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
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

    const roleCodes = userRolesList.map(r => r.roleCode)
    const isSuperAdmin = session!.user.isSuperAdmin
    const isAdmin = isSuperAdmin || roleCodes.some(code => code.endsWith('_ADMIN'))
    const canApprove = isAdmin
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
        organizationId = session!.user.officialOrganizationId || userRolesList[0]?.organizationId || session!.user.organizationId || ""
    }

    if (!organizationId) {
        // 3. Final Fallback: National Org
        const nationalOrg = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.level, 'NATIONAL'))
            .limit(1)

        organizationId = nationalOrg[0]?.id
    }

    // Special case for SuperAdmin: if still no org found (shouldn't happen with National fallback), 
    // but at least don't show the "Not Found" error if they are SYSTEM level.
    // Fetch current user's official and office details if they are an official
    const userOfficial = await db.select({ 
        id: officials.id, 
        organizationId: officials.organizationId
    })
    .from(officials)
    .where(eq(officials.userId, session!.user.id))
    .limit(1)

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
                        <CreateProgrammeDialog 
                            organizationId={organizationId || ""} 
                            isSuperAdmin={isSuperAdmin}
                            userOfficialId={userOfficialId}
                            userOfficeId={userOfficeId}
                            userLevel={session.user.officialLevel}
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
                            <ProgrammeList type="MY_PROGRAMMES" orgId={organizationId || ""} />
                        </Suspense>
                    </TabsContent>
 
                    <TabsContent value="approvals" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ProgrammeList type="TO_APPROVE" orgId={organizationId || ""} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

