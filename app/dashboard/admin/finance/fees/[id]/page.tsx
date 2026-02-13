import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { fees, feeAssignments, users } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FinanceNav } from "@/components/admin/finance/finance-nav"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CheckCircle, Clock, Search, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const dynamic = 'force-dynamic'

export default async function FeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: feeId } = await params
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Fetch fee details
    const [fee] = await db.select().from(fees).where(eq(fees.id, feeId))
    if (!fee) redirect("/dashboard/admin/finance/fees")

    // Fetch assignments for this fee
    const assignments = await db.select({
        assignment: feeAssignments,
        user: users
    })
        .from(feeAssignments)
        .innerJoin(users, eq(feeAssignments.userId, users.id))
        .where(eq(feeAssignments.feeId, feeId))
        .orderBy(desc(feeAssignments.paidAt))

    const totalCount = assignments.length
    const paidCount = assignments.filter(a => a.assignment.status === 'PAID').length
    const pendingCount = totalCount - paidCount

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Fee Details</h2>
            </div>

            <FinanceNav organizationId={fee.organizationId} />

            <div className="grid gap-4 md:grid-cols-4 whitespace-nowrap overflow-x-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fee Title</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{fee.title}</div>
                        <p className="text-xs text-muted-foreground">Min: NGN {parseFloat(fee.amount.toString()).toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{paidCount}</div>
                        <p className="text-xs text-muted-foreground">{totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : 0}% compliance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Assignments</CardTitle>
                    <CardDescription>Status of levies for all assigned members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead>Date Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No members assigned to this fee.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assignments.map((row) => (
                                    <TableRow key={row.assignment.id}>
                                        <TableCell>
                                            <div className="font-medium">{row.user.name}</div>
                                            <div className="text-xs text-muted-foreground">{row.user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={row.assignment.status === 'PAID' ? 'default' : 'secondary'}>
                                                {row.assignment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {row.assignment.status === 'PAID' ?
                                                `NGN ${parseFloat(row.assignment.amountPaid?.toString() || "0").toLocaleString()}` :
                                                "-"}
                                        </TableCell>
                                        <TableCell>
                                            {row.assignment.paidAt ? format(new Date(row.assignment.paidAt), "MMM d, yyyy") : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
