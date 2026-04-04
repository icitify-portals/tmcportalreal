import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { FeeForm } from "@/components/admin/finance/fee-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

import { OrganizationSelector } from "@/components/admin/organization-selector"
import { getAvailableOrganizations } from "@/lib/actions/occasions"

export default async function NewFeePage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const { orgId } = await searchParams
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Get organizations for selector
    const orgs = await getAvailableOrganizations()

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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    {isSuperAdmin && (
                        <OrganizationSelector 
                            organizations={orgs} 
                            currentOrgId={selectedOrgId} 
                        />
                    )}
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Fee</CardTitle>
                        <CardDescription>
                            Define a new mandatory payment for members or officials in your jurisdiction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedOrgId ? (
                            <FeeForm organizationId={selectedOrgId} />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                                Please select a jurisdiction (Organization) from the selector above to create a fee.
                            </div>
                        )}
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
