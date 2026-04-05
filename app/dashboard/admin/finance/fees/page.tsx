import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { fees, userRoles, roles, feeAssignments } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, Users, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

import { getOrganizations } from "@/lib/actions/organization"
import { JurisdictionSelector } from "@/components/admin/finance/jurisdiction-selector"

export default async function FeesAdminPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const { orgId } = await searchParams
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Get organizations for selector
    const orgs = await getOrganizations()

    // Find the organization context
    const userRole = await db.select({
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

    const isSuperAdmin = session.user.isSuperAdmin
    const userOrgId = userRole[0]?.organizationId
    const selectedOrgId = orgId || (isSuperAdmin ? "" : userOrgId || "")

    // Fetch existing fees based on selection
    const orgFees = await db.select().from(fees)
        .where(selectedOrgId ? eq(fees.organizationId, selectedOrgId) : undefined)
        .orderBy(desc(fees.createdAt))

    // For each fee, get simple stats
    const feesWithStats = await Promise.all(orgFees.map(async (fee) => {
        const stats = await db.select({
            total: sql<number>`count(*)`,
            paid: sql<number>`sum(case when ${feeAssignments.status} = 'PAID' then 1 else 0 end)`
        })
            .from(feeAssignments)
            .where(eq(feeAssignments.feeId, fee.id))

        return {
            ...fee,
            totalAssignments: stats[0]?.total || 0,
            paidAssignments: stats[0]?.paid || 0
        }
    }))

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    {isSuperAdmin && (
                        <JurisdictionSelector 
                            organizations={orgs} 
                            currentOrgId={selectedOrgId} 
                        />
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href={`/dashboard/admin/finance/fees/new${selectedOrgId ? `?orgId=${selectedOrgId}` : ""}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Fee
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {feesWithStats.length === 0 ? (
                    <Card className="col-span-full py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-lg font-medium">No fees created yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Start by creating a levy for your members or officials.
                                </p>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/dashboard/admin/finance/fees/new">
                                    Create Your First Fee
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    feesWithStats.map((fee) => (
                        <Card key={fee.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={fee.isActive ? "default" : "secondary"}>
                                        {fee.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Badge variant="outline">{fee.targetType.replace('_', ' ')}</Badge>
                                </div>
                                <CardTitle className="mt-2 text-xl">{fee.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {fee.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-2xl font-bold">
                                        NGN {parseFloat(fee.amount.toString()).toLocaleString()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <Users className="mr-2 h-4 w-4" />
                                            {fee.totalAssignments} Assigned
                                        </div>
                                        <div className="flex items-center text-green-600 font-medium">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {fee.paidAssignments} Paid
                                        </div>
                                    </div>

                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-full"
                                            style={{
                                                width: `${fee.totalAssignments > 0 ? (fee.paidAssignments / fee.totalAssignments) * 100 : 0}%`
                                            }}
                                        />
                                    </div>

                                    {fee.dueDate && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="mr-2 h-3 w-3" />
                                            Due: {format(new Date(fee.dueDate), "PPP")}
                                        </div>
                                    )}

                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/dashboard/admin/finance/fees/${fee.id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
