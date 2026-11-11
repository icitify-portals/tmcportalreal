export const dynamic = 'force-dynamic'

import { getFinancialSummary } from "@/lib/actions/finance"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ExportCSV } from "@/components/admin/shared/export-csv"
import { formatCurrency } from "@/lib/utils"

export default async function ReportsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    let organizationId = ""
    let orgName = "The Muslim Congress"

    const [hqOrg] = await db.select().from(organizations)
        .where(eq(organizations.name, 'The Muslim Congress (National)'))
        .limit(1)

    if (hqOrg) {
        organizationId = hqOrg.id
        orgName = hqOrg.name
    } else {
        const [firstOrg] = await db.select().from(organizations).limit(1)
        if (firstOrg) {
            organizationId = firstOrg.id
            orgName = firstOrg.name
        }
    }

    const summary = await getFinancialSummary(organizationId)

    const reportData = [
        {
            metric: "Total Inflows",
            amount: summary.totalInflow.toFixed(2),
            currency: "NGN",
            jurisdiction: orgName,
            notes: "All recorded revenue, dues, and donations"
        },
        {
            metric: "Total Outflows",
            amount: summary.totalOutflow.toFixed(2),
            currency: "NGN",
            jurisdiction: orgName,
            notes: "All recorded disbursements and expenses"
        },
        {
            metric: "Net Position (Balance)",
            amount: summary.balance.toFixed(2),
            currency: "NGN",
            jurisdiction: orgName,
            notes: "Current net financial liquidity"
        },
    ]

    const reportHeaders = [
        { key: "metric", label: "Metric" },
        { key: "amount", label: "Amount (NGN)" },
        { key: "currency", label: "Currency" },
        { key: "jurisdiction", label: "Jurisdiction" },
        { key: "notes", label: "Notes" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Financial Reports</h3>
                    <p className="text-sm text-muted-foreground">High-level financial standing and cash flow overview for {orgName}.</p>
                </div>
                <ExportCSV
                    data={reportData}
                    filename="tmc_financial_summary_report"
                    headers={reportHeaders}
                    buttonText="Export Summary CSV"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Cash Flow Summary</CardTitle>
                            <CardDescription>Overview of inflows and outflows</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex justify-between border-b pb-2">
                            <span>Total Inflows</span>
                            <span className="font-semibold text-green-600">{formatCurrency(summary.totalInflow)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span>Total Outflows</span>
                            <span className="font-semibold text-red-600">{formatCurrency(summary.totalOutflow)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="font-bold">Net Position</span>
                            <span className={`font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                {formatCurrency(summary.balance)}
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
                        <div className="h-[150px] flex items-center justify-center bg-muted/20 rounded mt-4 text-xs text-muted-foreground">
                            Chart: Budget Utilization
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
