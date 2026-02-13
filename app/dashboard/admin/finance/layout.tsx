import { FinanceNav } from "@/components/admin/finance/finance-nav"
import { Separator } from "@/components/ui/separator"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { userRoles, roles, officials } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function FinanceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

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

    const hasRole = userRolesList.length > 0
    let organizationId = userRolesList[0]?.organizationId

    // Fallback: Check if official
    const officialsList = await db.select({ organizationId: officials.organizationId })
        .from(officials)
        .where(eq(officials.userId, session.user.id))
        .limit(1)

    const isOfficial = officialsList.length > 0
    if (!organizationId && isOfficial) {
        organizationId = officialsList[0]?.organizationId
    }

    // If still no organizationId, try session
    if (!organizationId && (hasRole || isOfficial)) {
        organizationId = session.user.organizationId
    }

    // Access Check: Must have a role OR be an official
    if (!hasRole && !isOfficial) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
                <p>You do not have administrative access to any organization.</p>
            </div>
        )
    }

    if (!organizationId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Organization Context Missing</h2>
                <p>Could not determine the organization for your session.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Finance Management</h2>
                <p className="text-muted-foreground">
                    Manage budgets, fund requests, and view financial reports.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-full">
                    <FinanceNav organizationId={organizationId} />
                    {children}
                </div>
            </div>
        </div>
    )
}

