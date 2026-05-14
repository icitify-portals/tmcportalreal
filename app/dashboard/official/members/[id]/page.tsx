export const dynamic = 'force-dynamic'
import { getServerSession } from "@/lib/session"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { members, officials, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { requirePermission } from "@/lib/rbac-v2"

import { getMockJurisdiction } from "@/lib/mock-jurisdiction"

export default async function OfficialMemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()
    
    // 1. Check permission
    requirePermission(session, "members:read")

    const mock = await getMockJurisdiction()
    const isSuperAdmin = session?.user?.roles?.some((r: any) => r.jurisdictionLevel === "SYSTEM")

    if (!session?.user?.officialId && !(isSuperAdmin && mock)) {
        return redirect("/dashboard/official")
    }

    // 2. Fetch member and their data
    const rawMember = await db.query.members.findFirst({
        where: eq(members.id, id)
    })

    if (!rawMember) return notFound()

    // 3. Jurisdiction Check
    let organization: any = null
    let positionLevel = ""

    if (isSuperAdmin && mock) {
        positionLevel = mock.level
        const mockOrg = await db.query.organizations.findFirst({
            where: (org, { and, eq }) => {
                const conds = [eq(org.level, mock.level as any)]
                if (mock.state) conds.push(eq(org.state, mock.state))
                if (mock.lga) conds.push(eq(org.city, mock.lga))
                return and(...conds)
            }
        })
        organization = mockOrg || { id: "mock-id", name: `Mock ${mock.level}`, level: mock.level, state: mock.state, city: mock.lga }
    } else {
        const officialData = await db.query.officials.findFirst({
            where: eq(officials.id, session!.user.officialId!),
            with: {
                organization: true
            }
        })
        if (!officialData) return notFound()
        organization = officialData.organization
        positionLevel = officialData.positionLevel || ""
    }

    const meta = rawMember.metadata as any || {}

    let canAccess = false
    if (session!.user.isSuperAdmin) {
        canAccess = true
    } else if (positionLevel === 'STATE') {
        canAccess = meta.state === organization.state
    } else if (positionLevel === 'LOCAL_GOVERNMENT') {
        canAccess = meta.state === organization.state && meta.lga === organization.city
    } else if (positionLevel === 'BRANCH') {
        canAccess = rawMember.organizationId === organization.id
    }

    if (!canAccess) {
        return (
            <DashboardLayout>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">This member is outside your jurisdiction.</p>
                    <Link href="/dashboard/official/members">
                        <Button className="mt-4">Back to List</Button>
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    // 4. Fetch relations manually (to avoid lateral join issues)
    const [userData, orgData, recommenderData, approverData] = await Promise.all([
        db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, rawMember.userId) }),
        db.query.organizations.findFirst({ where: (o, { eq }) => eq(o.id, rawMember.organizationId) }),
        rawMember.recommendedBy ? db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, rawMember.recommendedBy!),
            columns: { name: true }
        }) : Promise.resolve(null),
        rawMember.approvedBy ? db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, rawMember.approvedBy!),
            columns: { name: true }
        }) : Promise.resolve(null),
    ])

    const member = {
        ...rawMember,
        user: userData!,
        organization: orgData!,
        recommender: recommenderData,
        approver: approverData,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/dashboard/official/members" className="text-xs text-muted-foreground hover:text-primary">Members</Link>
                            <span className="text-xs text-muted-foreground">/</span>
                            <span className="text-xs font-medium text-primary">Details</span>
                        </div>
                        <h1 className="text-3xl font-bold">{member.user.name}</h1>
                        <p className="text-muted-foreground">{member.organization.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                            {member.status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Biographical Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                                        <p>{meta.fullName || member.user.name}</p>
                                    </div>
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Member ID</span>
                                        <p className="font-mono">{member.memberId || "Pending"}</p>
                                    </div>
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                        <p>{member.user.phone || meta.phone || "N/A"}</p>
                                    </div>
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                                        <p className="break-all">{member.user.email}</p>
                                    </div>
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Marital Status</span>
                                        <p>{meta.maritalStatus || "N/A"}</p>
                                    </div>
                                    <div className="break-words">
                                        <span className="text-sm font-medium text-muted-foreground">Occupation</span>
                                        <p>{member.occupation || "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Origin & Jurisdiction</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">State</span>
                                        <p>{meta.state || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">LGA</span>
                                        <p>{meta.lga || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Branch</span>
                                        <p>{meta.branch || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Joined</span>
                                        <p>{member.createdAt ? format(new Date(member.createdAt), 'PP') : "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Membership Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Current Status</span>
                                    <div className="pt-1">
                                        <Badge className="text-lg py-1 px-3" variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                                            {member.status}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {member.approvedBy && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm border border-green-100 dark:border-green-900/40">
                                        <p className="font-medium text-green-800 dark:text-green-300">Approved By</p>
                                        <p>{member.approver?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.approvedAt ? format(new Date(member.approvedAt), 'PP') : ""}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground italic">
                                        Only National Admins can perform advanced administrative actions on member records.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
