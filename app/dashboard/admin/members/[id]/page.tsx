export const dynamic = 'force-dynamic'
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { members } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ApprovalActions } from "@/components/admin/approval-actions"
import { IdManager } from "@/components/admin/id-manager"

export default async function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()

    if (id === 'new') {
        // Handle member creation - for now, redirect to apply or show a message if form doesn't exist
        // Based on our search, a specific admin/members/new form might be missing.
        // For now, let's just show a simple "Not Found" or "Implementation Pending" to stop the SQL crash.
        return (
            <DashboardLayout>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold">Add New Member</h1>
                    <p className="text-muted-foreground mt-2">Member creation form is under development or available via the public apply route.</p>
                    <Link href="/dashboard/admin/members">
                        <Button className="mt-4">Go Back</Button>
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    // Fetch member manually to avoid LATERAL JOIN issues with MariaDB
    const rawMember = await db.query.members.findFirst({
        where: eq(members.id, id)
    })

    if (!rawMember) return notFound()

    // Fetch relations manually
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

    // Parse metadata for display
    const meta = member.metadata as any || {}

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                                        <p>{meta.fullName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">App ID / Member ID</span>
                                        <div className="flex items-center">
                                            <p className="font-mono">{member.memberId}</p>
                                            <IdManager memberId={member.id} currentId={member.memberId} />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                        <p>{member.user.phone || meta.phone}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                                        <p>{member.user.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Marital Status</span>
                                        <p>{meta.maritalStatus || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Occupation</span>
                                        <p>{member.occupation}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Health & Emergency</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Genotype</span>
                                        <p>{meta.genotype || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Blood Group</span>
                                        <p>{meta.blood_group || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Emergency Contact</span>
                                        <p>{member.emergencyContact} ({member.emergencyPhone})</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status & Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {member.recommendedBy && (
                                    <div className="p-3 bg-muted rounded-md text-sm">
                                        <p className="font-medium">Recommended By</p>
                                        <p>{member.recommender?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.recommendedAt ? format(new Date(member.recommendedAt), 'PP') : ""}
                                        </p>
                                    </div>
                                )}

                                {member.approvedBy && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                                        <p className="font-medium">Approved By</p>
                                        <p>{member.approver?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.approvedAt ? format(new Date(member.approvedAt), 'PP') : ""}
                                        </p>
                                    </div>
                                )}

                                <ApprovalActions
                                    memberId={member.id}
                                    currentStatus={member.status || "PENDING"}
                                    userRole="ADMIN" // We should derive this real role
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
