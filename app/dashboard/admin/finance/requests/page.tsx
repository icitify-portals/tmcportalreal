export const dynamic = 'force-dynamic'

import { getRequests } from "@/lib/actions/finance"
import { CreateRequestDialog } from "@/components/admin/finance/create-request-dialog"
import { RequestsClientList } from "@/components/admin/finance/requests-client-list"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { organizations, officials, userRoles, roles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function RequestsPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    const sp = await searchParams
    const isSuperAdmin = session.user.isSuperAdmin

    // Resolve user's official position and organization
    const userOfficial = await db.select({
        id: officials.id,
        organizationId: officials.organizationId,
        positionLevel: officials.positionLevel,
    })
    .from(officials)
    .where(eq(officials.userId, session.user.id))
    .limit(1)

    const userRolesList = await db.select({
        organizationId: userRoles.organizationId,
        roleCode: roles.code,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.isActive, true)))

    let resolvedOrgId = userOfficial[0]?.organizationId || session.user.officialOrganizationId || userRolesList[0]?.organizationId || session.user.organizationId || ""

    if (!resolvedOrgId && !isSuperAdmin) {
        const national = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.level, "NATIONAL")).limit(1)
        resolvedOrgId = national[0]?.id || ""
    }

    const effectiveOrgId = sp.orgId || (isSuperAdmin ? "" : resolvedOrgId)
    const requests = await getRequests(effectiveOrgId || undefined) || []

    // Check approvals: Executive Leader (Amir / Waali / Wakil / Raqib / Admin)
    const roleCodes = userRolesList.map(r => r.roleCode)
    const canApprove = isSuperAdmin || Boolean(userOfficial[0]) || roleCodes.some(c => c.includes("ADMIN") || c.includes("AMIR") || c.includes("WAALI") || c.includes("WAKIL") || c.includes("RAQIB") || c.includes("PRESIDENT") || c.includes("CHAIRMAN"))
    const canDisburse = isSuperAdmin || roleCodes.some(c => c.includes("FIN") || c.includes("TREASURER") || c.includes("ACCOUNTANT") || c.includes("ADMIN"))

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-green-950">Fund Requests</h2>
                        <p className="text-sm text-muted-foreground">
                            4-Stage Hierarchical Routing: Officer &rarr; Amir/Waali/Wakil/Raqib &rarr; Financial Secretary &rarr; Applicant Notification.
                        </p>
                    </div>
                    <div>
                        <CreateRequestDialog organizationId={resolvedOrgId || "default-org"} />
                    </div>
                </div>

                <RequestsClientList
                    requests={requests as any}
                    canApprove={canApprove}
                    canDisburse={canDisburse}
                />
            </div>
        </DashboardLayout>
    )
}

