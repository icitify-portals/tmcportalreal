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
import { JurisdictionFilter } from "../analytics/jurisdiction-filter"

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
        const [firstOrg] = await db.select().from(organizations).limit(1)
        if (firstOrg) organizationId = firstOrg.id
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

                <div className="grid gap-4">
                    {budgets.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No budgets found for this organization. Create one to get started.
                            </CardContent>
                        </Card>
                    ) : budgets.map((budget) => (
                        <Card key={budget.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{budget.title}</CardTitle>
                                    <CardDescription>Year: {budget.year} • Created by {budget.creator?.name}</CardDescription>
                                </div>
                                <Badge variant={budget.status === 'APPROVED' ? 'default' : 'secondary'}>
                                    {budget.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 space-y-4">
                                    <div className="text-2xl font-bold">{formatCurrency(parseFloat(budget.totalAmount))}</div>

                                    <div className="border rounded-md p-4">
                                        <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                                        <ul className="space-y-2">
                                            {budget.items.map((item: any) => (
                                                <li key={item.id} className="flex justify-between text-sm">
                                                    <span>{item.category}: {item.description}</span>
                                                    <span>{formatCurrency(parseFloat(item.amount))}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {budget.status !== 'APPROVED' && (
                                        <form action={async () => {
                                            "use server"
                                            await approveBudget(budget.id)
                                        }}>
                                            <Button size="sm">Approve Budget</Button>
                                        </form>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
    )
}

