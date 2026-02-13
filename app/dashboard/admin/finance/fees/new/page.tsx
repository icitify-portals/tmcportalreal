import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { FeeForm } from "@/components/admin/finance/fee-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FinanceNav } from "@/components/admin/finance/finance-nav"

export const dynamic = 'force-dynamic'

export default async function NewFeePage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Find the organization where the user is a Financial Officer or Admin
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

    const organizationId = userRole[0]?.organizationId

    if (!organizationId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
                </div>
                <p>You do not have administrative access to any organization.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Finance Management</h2>
            </div>

            <FinanceNav organizationId={organizationId} />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Fee</CardTitle>
                        <CardDescription>
                            Define a new mandatory payment for members or officials in your jurisdiction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FeeForm organizationId={organizationId} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Guidance</CardTitle>
                        <CardDescription>How fee assignment works</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            <strong>National Fees:</strong> Fees created at the National level apply to ALL members across all states and branches.
                        </p>
                        <p>
                            <strong>Jurisdictional Fees:</strong> Fees created at State or Branch levels apply only to members within that specific jurisdiction.
                        </p>
                        <p>
                            <strong>Targeting:</strong> You can choose to target all members or just officials. Assignments are generated immediately upon creation.
                        </p>
                        <p>
                            <strong>Overpayment:</strong> Members will be allowed to pay more than the stipulated amount, but the system will block any payment below the minimum.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
