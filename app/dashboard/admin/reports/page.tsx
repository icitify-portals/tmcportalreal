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
import { organizations, userRoles, roles, officials } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReportSubmissionDialog } from "@/components/admin/reports/report-submission-dialog"
import { OfficeRollupGenerator } from "@/components/admin/reports/office-rollup-generator"

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

async function ReportList({ orgId, type, period, officeId, targetOrgId }: { orgId: string, type: 'MY_REPORTS' | 'APPROVALS', period?: string, officeId?: string, targetOrgId?: string }) {
    const effectiveOrg = targetOrgId || orgId
    const reports = await getReports({
        organizationId: effectiveOrg || undefined,
        status: type === 'APPROVALS' ? 'SUBMITTED' : undefined,
        type: 'MONTHLY_ACTIVITY',
        officeId: officeId || undefined,
        period: period || undefined,
        includeHierarchy: type === 'APPROVALS' ? true : false
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
                        
                        {(r.content as any)?.fileUrl && (
                            <div className="mt-2">
                                <a href={(r.content as any).fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-sm font-medium">
                                    <FileText className="h-4 w-4 mr-1" /> View Attachment
                                </a>
                            </div>
                        )}

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

async function QuarterlyAnnualList({ orgId, type, officeId, targetOrgId }: { orgId: string, type: 'QUARTERLY_STATE' | 'ANNUAL_CONGRESS', officeId?: string, targetOrgId?: string }) {
    const effectiveOrg = targetOrgId || orgId
    const reports = await getReports({
        organizationId: effectiveOrg || undefined,
        type,
        officeId: officeId || undefined,
        includeHierarchy: true
    })
    if (reports.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">No {type.replace('_',' ')} reports yet. Use Generator above.</div>
    }
    return (
        <div className="grid gap-4">
            {reports.map((r) => (
                <Card key={r.id}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{r.title}</CardTitle>
                                <CardDescription>{r.type.replace('_',' ')} • Period: {r.period} • {(r.content as any)?.stats ? `${(r.content as any).stats.total}/${(r.content as any).stats.expected} coverage ${(r.content as any).stats.coverage}%` : ''}</CardDescription>
                            </div>
                            <Badge className={getStatusColor(r.status || "")}>{r.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <div>{r.organization?.name} • {r.office?.name || 'National (all offices)'} • by {r.user?.name}</div>
                        {(r.content as any)?.summary && <p className="mt-2 text-gray-700 line-clamp-3">{(r.content as any).summary}</p>}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ period?: string; officeId?: string; targetOrgId?: string; status?: string }> }) {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")
    const sp = searchParams ? await searchParams : {}
    const periodFilter = sp.period || ""
    const officeFilter = sp.officeId || ""
    const targetOrgId = sp.targetOrgId || ""

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

    if (!organizationId && !session.user.isSuperAdmin) {
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

    const [official] = await db.select({ officeId: officials.officeId })
        .from(officials)
        .where(eq(officials.userId, session.user.id))
        .limit(1)

    const offices = organizationId ? await getOffices(organizationId) : []
    // jurisdiction selector for executives (hierarchy)
    const allOrgs = await db.select({ id: organizations.id, name: organizations.name, level: organizations.level, parentId: organizations.parentId }).from(organizations)
    const map = new Map<string, string[]>()
    for (const o of allOrgs) { if (!o.parentId) continue; if (!map.has(o.parentId)) map.set(o.parentId, []); map.get(o.parentId)!.push(o.id) }
    const collect: string[] = []; const q: string[] = organizationId ? [organizationId] : []
    const seen = new Set<string>()
    while (q.length) { const cur = q.shift()!; if (seen.has(cur)) continue; seen.add(cur); collect.push(cur); (map.get(cur) ?? []).forEach(c=>q.push(c)) }
    const jurisdictions = allOrgs.filter(o=>collect.includes(o.id) && o.id !== organizationId).map(o=>({id:o.id,name:o.name,level:o.level}))

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Monthly Office Reports</h2>
                    <div className="flex items-center space-x-2">
                        <form action={async () => {
                            "use server"
                            if (organizationId) {
                                await initializeDefaultOffices(organizationId)
                            }
                        }}>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Initialize Offices
                            </Button>
                        </form>
                        <ReportSubmissionDialog organizationId={organizationId || ""} offices={offices} userOfficeId={official?.officeId} />
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-3">
                    <form method="GET" className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                            <label className="text-xs font-semibold">Month (Period)</label>
                            <input type="month" name="period" defaultValue={periodFilter} className="w-full border rounded-md h-9 px-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold">Office</label>
                            <select name="officeId" defaultValue={officeFilter} className="w-full border rounded-md h-9 px-3 text-sm">
                                <option value="">All offices</option>
                                {offices.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold">Jurisdiction</label>
                            <select name="targetOrgId" defaultValue={targetOrgId} className="w-full border rounded-md h-9 px-3 text-sm">
                                <option value="">This jurisdiction + children</option>
                                {jurisdictions.map(j=><option key={j.id} value={j.id}>{j.name} • {j.level}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="submit" size="sm">Filter</Button>
                            <Button type="button" variant="outline" size="sm" onClick={()=>{ if(typeof window!=='undefined') window.location.href='/dashboard/admin/reports' }}>Clear</Button>
                        </div>
                        <div className="flex items-end">
                            <p className="text-[11px] text-muted-foreground">Each office Monthly → Executives at respective jurisdiction. National sees all.</p>
                        </div>
                    </form>
                </div>

                <OfficeRollupGenerator organizationId={organizationId || ""} offices={offices} isNational={session.user.isSuperAdmin || session.user.officialLevel === 'NATIONAL'} />

                <Tabs defaultValue="my-reports" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-reports">My Office (Monthly)</TabsTrigger>
                        <TabsTrigger value="approvals">Executives — Pending Approvals</TabsTrigger>
                        <TabsTrigger value="quarterly">Quarterly (Generated)</TabsTrigger>
                        <TabsTrigger value="annual">Annual (Generated)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-reports" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ReportList type="MY_REPORTS" orgId={organizationId || ""} period={periodFilter || undefined} officeId={official?.officeId || officeFilter || undefined} targetOrgId={targetOrgId || undefined} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="approvals" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ReportList type="APPROVALS" orgId={organizationId || ""} period={periodFilter || undefined} officeId={officeFilter || undefined} targetOrgId={targetOrgId || undefined} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="quarterly" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <QuarterlyAnnualList orgId={organizationId || ""} type="QUARTERLY_STATE" officeId={officeFilter || undefined} targetOrgId={targetOrgId || undefined} />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="annual" className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <QuarterlyAnnualList orgId={organizationId || ""} type="ANNUAL_CONGRESS" officeId={officeFilter || undefined} targetOrgId={targetOrgId || undefined} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
