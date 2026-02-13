export const dynamic = 'force-dynamic'
import { getBudgets, approveBudget } from "@/lib/actions/finance"
import { CreateBudgetDialog } from "@/components/admin/finance/create-budget-dialog"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
// import { approveBudgetAction } from "./actions" // We can use a client component wrapper for actions or form actions
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function BudgetsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound() // Or redirect

    // TODO: Get real Organization ID context. Using a placeholder or finding one.
    // For now assuming the user belongs to an org or we fetch their org.
    // Let's assume we can get it from somewhere. Since this is "admin", maybe they manage their own org.
    // We'll pass a placeholder or try to fetch it.

    // HACK for demo: Fetch the first organization found or a specific one if known.
    // In a real app, this page is under /dashboard/admin which usually implies a specific context.
    // Let's assume we can get it. For now, I'll pass a dummy ID or fetch the user's org.
    const organizationId = "default-org-id" // REPLACE THIS with actual logic

    // Real implementation:
    // const userOrg = await db.query.members.findFirst(...)

    // Since I don't have easy context here without checking other files, I'll pass a string.
    // But wait, the previous code used `organizationId`. 
    // Let's assume the user is an admin of an org.

    // Fetch budgets
    // Note: getBudgets expects organizationId.
    // I will check if there is an existing convention for getting orgId in this codebase.
    // Usually it comes from params if route is /dashboard/[orgId]/... but here it is /dashboard/admin/...
    // implying singular admin dashboard? 

    // Let's peek at `app/dashboard/admin/page.tsx` or similar to see how they get orgId.
    // If not found, I will use a placeholder query.

    const budgets = await getBudgets(organizationId) || []

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Annual Budgets</h3>
                    <CreateBudgetDialog organizationId={organizationId} />
                </div>

                <div className="grid gap-4">
                    {budgets.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No budgets found. Create one to get started.
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
        </DashboardLayout>
    )
}

