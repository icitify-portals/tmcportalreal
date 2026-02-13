export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { payments, users, organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { desc, eq, inArray } from "drizzle-orm"
import { format } from "date-fns"


export default async function PaymentsPage() {
    const session = await getServerSession()

    const rawPayments = await db.query.payments.findMany({
        orderBy: [desc(payments.createdAt)],
        limit: 100,
    })

    const userIds = [...new Set(rawPayments.map(p => p.userId).filter(Boolean))] as string[]
    const orgIds = [...new Set(rawPayments.map(p => p.organizationId).filter(Boolean))] as string[]

    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
        columns: { id: true, name: true, email: true }
    }) : []

    const orgsData = orgIds.length > 0 ? await db.query.organizations.findMany({
        where: (o, { inArray }) => inArray(o.id, orgIds),
        columns: { id: true, name: true }
    }) : []

    const paymentsList = rawPayments.map(payment => ({
        ...payment,
        user: usersData.find(u => u.id === payment.userId) || { name: 'Guest', email: 'N/A' },
        organization: orgsData.find(o => o.id === payment.organizationId) || { name: 'System' }
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <CreditCard className="h-8 w-8 text-primary" />
                            Payments
                        </h1>
                        <p className="text-muted-foreground">Monitor and manage all system transactions</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm"
                            placeholder="Search by reference, user or description..."
                        />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>View and verify recent payments and donations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3 font-medium">Reference</th>
                                        <th className="p-3 font-medium">User / Member</th>
                                        <th className="p-3 font-medium">Type</th>
                                        <th className="p-3 font-medium">Amount</th>
                                        <th className="p-3 font-medium">Status</th>
                                        <th className="p-3 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paymentsList.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                                            <td className="p-3">
                                                <span className="font-mono text-xs text-muted-foreground">{payment.paystackRef || "MANUAL"}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payment.user.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{payment.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {payment.paymentType}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-bold text-primary" suppressHydrationWarning>
                                                {payment.currency} {parseFloat(payment.amount.toString()).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant={payment.status === "SUCCESS" ? "default" : "secondary"}
                                                    className={payment.status === "SUCCESS" ? "bg-green-600 hover:bg-green-700" : ""}
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-muted-foreground" suppressHydrationWarning>
                                                {payment.createdAt ? format(new Date(payment.createdAt), 'PP') : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentsList.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                                                No transactions recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
