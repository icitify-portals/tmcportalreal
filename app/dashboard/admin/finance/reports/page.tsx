export const dynamic = 'force-dynamic'
import { getFinancialSummary } from "@/lib/actions/finance"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function ReportsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    const organizationId = "default-org-id"
    const summary = await getFinancialSummary(organizationId)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Financial Reports</h3>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cash Flow Summary</CardTitle>
                            <CardDescription>Overview of inflows and outflows</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span>Total Inflows</span>
                                <span className="font-semibold text-green-600">{summary.totalInflow} NGN</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Total Outflows</span>
                                <span className="font-semibold text-red-600">{summary.totalOutflow} NGN</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-bold">Net Position</span>
                                <span className={`font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    {summary.balance} NGN
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Budget vs Actual</CardTitle>
                            <CardDescription>Performance against planned budget</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Budget utilization reports will appear here once data is sufficient.
                            </p>
                            {/* Placeholder for future implementation */}
                            <div className="h-[150px] flex items-center justify-center bg-muted/20 rounded mt-4">
                                Chart: Budget Utilization
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

