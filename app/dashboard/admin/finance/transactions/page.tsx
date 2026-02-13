export const dynamic = 'force-dynamic'
import { getTransactions, getFinancialSummary } from "@/lib/actions/finance"
import { RecordInflowDialog } from "@/components/admin/finance/record-inflow-dialog"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


export default async function TransactionsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    const organizationId = "default-org-id" // TODO: Real context

    const transactions = await getTransactions(organizationId) || []
    const summary = await getFinancialSummary(organizationId)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Financial Ledger</h3>
                    <RecordInflowDialog organizationId={organizationId} />
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(summary.totalInflow)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(summary.totalOutflow)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                                {formatCurrency(summary.balance)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ledger Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Performed By</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.type === 'INFLOW' ? 'outline' : 'secondary'} className={tx.type === 'INFLOW' ? 'border-green-500 text-green-600' : ''}>
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.category}</div>
                                            <div className="text-xs text-muted-foreground">{tx.description}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {tx.performer?.name}
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'INFLOW' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No transactions recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

