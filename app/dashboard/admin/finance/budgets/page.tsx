export const dynamic = 'force-dynamic'
import { getBudgets, approveBudget } from "@/lib/actions/finance"
import { getAvailableJurisdictions } from "@/lib/actions/analytics"
import { CreateBudgetDialog } from "@/components/admin/finance/create-budget-dialog"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { JurisdictionFilter } from "../analytics/jurisdiction-filter"
import { BudgetsTable } from "@/components/admin/finance/budgets-table"

export default async function BudgetsPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    const { orgId } = await searchParams || {}
    let organizationId = orgId || ""

    if (!organizationId) {
        // Try to default to TMC Headquarters first
        const [hqOrg] = await db.select().from(organizations)
            .where(eq(organizations.name, 'The Muslim Congress (National)'))
            .limit(1)
        
        if (hqOrg) {
            organizationId = hqOrg.id
        } else {
            const [firstOrg] = await db.select().from(organizations).limit(1)
            if (firstOrg) organizationId = firstOrg.id
        }
    }

    const budgets = await getBudgets(organizationId || "") || []
    const jurisdictions = await getAvailableJurisdictions()

    return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Annual Budgets</h1>
                        <p className="text-muted-foreground">Manage organizational budgets and line items.</p>
                    </div>

                    {jurisdictions.length > 0 && (
                        <div className="w-full md:w-64">
                            <JurisdictionFilter
                                jurisdictions={jurisdictions}
                                currentId={organizationId}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Budgets List</h3>
                    <CreateBudgetDialog organizationId={organizationId} />
                </div>

                <BudgetsTable 
                    budgets={budgets} 
                    approveAction={async (id) => {
                        "use server"
                        return await approveBudget(id)
                    }} 
                />
            </div>
    )
}

