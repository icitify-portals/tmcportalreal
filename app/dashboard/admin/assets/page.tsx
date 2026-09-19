export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { organizations, users, officials, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getAssets, getAssetStats } from "@/lib/actions/assets"
import { CreateAssetDialog } from "@/components/admin/assets/create-asset-dialog"
import { AssetsTable } from "@/components/admin/assets/assets-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


async function AssetsList({ organizationId }: { organizationId: string }) {
    const assets = await getAssets(organizationId)

    return <AssetsTable assets={assets} organizationId={organizationId} />
}

async function AssetStats({ organizationId }: { organizationId: string }) {
    const stats = await getAssetStats(organizationId) || []

    const totalAssets = stats.reduce((acc, curr) => acc + (curr.totalCount || 0), 0)
    const totalValue = stats.reduce((acc, curr) => acc + parseFloat(curr.totalValue || "0"), 0)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalAssets}</div>
                    <p className="text-xs text-muted-foreground">Registered across jurisdiction</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                    <p className="text-xs text-muted-foreground">Estimated current value</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default async function AssetsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return redirect("/auth/login")

    // Fetch user's org
    const userResult = await db.select({
        user: users,
        officialProfile: officials
    })
        .from(users)
        .leftJoin(officials, eq(users.id, officials.userId))
        .where(eq(users.id, session.user.id))
        .limit(1)

    const user = userResult[0] ? {
        ...userResult[0].user,
        officialProfile: userResult[0].officialProfile
    } : null

    // Check for role-based organization
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

    // Hierarchy of checks: Official -> Role -> Session
    let organizationId = user?.officialProfile?.organizationId
        || userRolesList[0]?.organizationId
        || session.user.organizationId

    // Final Fallback: If still no ID, find the National Organization (likely Super Admin system view)
    if (!organizationId) {
        const nationalOrg = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.level, 'NATIONAL'))
            .limit(1)

        organizationId = nationalOrg[0]?.id
    }

    if (!organizationId && !session.user.isSuperAdmin) {
        return <div className="p-8">Unauthorized: No Organization Assigned</div>
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
                    <div className="flex items-center space-x-2">
                        <CreateAssetDialog organizationId={organizationId} />
                    </div>
                </div>

                <Suspense fallback={<div>Loading Stats...</div>}>
                    <AssetStats organizationId={organizationId} />
                </Suspense>

                <Suspense fallback={<div>Loading Assets...</div>}>
                    <AssetsList organizationId={organizationId} />
                </Suspense>
            </div>
        </DashboardLayout>
    )
}
