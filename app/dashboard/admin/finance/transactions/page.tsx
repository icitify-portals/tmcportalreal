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
import { getAvailableJurisdictions } from "@/lib/actions/analytics"
import { JurisdictionFilter } from "../analytics/jurisdiction-filter"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ExportCSV } from "@/components/admin/shared/export-csv"
import { format } from "date-fns"

export default async function TransactionsPage({
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

    const transactions = await getTransactions(organizationId) || []
    const summary = await getFinancialSummary(organizationId)
    const jurisdictions = await getAvailableJurisdictions()
    const currentOrg = jurisdictions.find(j => j.id === organizationId)
    const orgSlug = (currentOrg?.name || "tmc").toLowerCase().replace(/[^a-z0-9]+/g, "_")

    // Format export rows with all available ledger fields
    const exportLedgerRows = transactions.map(tx => {
        const amt = parseFloat(tx.amount.toString()).toFixed(2)
        return {
            id: tx.id,
            date: tx.date ? format(new Date(tx.date), 'yyyy-MM-dd HH:mm:ss') : "",
            type: tx.type,
            category: tx.category,
            description: (tx.description || "").replace(/[\r\n]+/g, " "),
            amount: amt,
            signedAmount: tx.type === 'INFLOW' ? `+${amt}` : `-${amt}`,
            performedByName: tx.performer?.name || "System",
            performedByEmail: tx.performer?.email || "",
            organizationName: currentOrg?.name || "N/A",
            relatedRequestTitle: tx.relatedRequest?.title || "",
            relatedRequestId: tx.relatedRequestId || "",
        }
    })

    const ledgerCsvHeaders = [
        { key: "date", label: "Date & Time" },
        { key: "type", label: "Transaction Type (INFLOW/OUTFLOW)" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "amount", label: "Amount (NGN)" },
        { key: "signedAmount", label: "Net Inflow/Outflow (+/-)" },
        { key: "performedByName", label: "Performed By" },
        { key: "performedByEmail", label: "Performer Email" },
        { key: "organizationName", label: "Jurisdiction" },
        { key: "relatedRequestTitle", label: "Related Request Title" },
        { key: "relatedRequestId", label: "Request ID" },
        { key: "id", label: "Transaction ID" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Financial Ledger</h3>
                    <p className="text-sm text-muted-foreground">Monitor and record all financial transactions.</p>
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

            <div className="flex flex-wrap items-center justify-end gap-2">
                <ExportCSV
                    data={exportLedgerRows}
                    filename={`tmc_ledger_${orgSlug}`}
                    headers={ledgerCsvHeaders}
                    buttonText="Download Ledger CSV"
                />
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
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            All ledger entries for {currentOrg?.name || "this jurisdiction"} ({transactions.length} total)
                        </CardDescription>
                    </div>
                    <ExportCSV
                        data={exportLedgerRows}
                        filename={`tmc_ledger_${orgSlug}`}
                        headers={ledgerCsvHeaders}
                        buttonText="Download CSV"
                    />
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-md">
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
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
