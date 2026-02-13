import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { feeAssignments, fees, organizations, users } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { FeePaymentButton } from "@/components/finance/fee-payment-button"

export const dynamic = 'force-dynamic'

export default async function MemberFinancePage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Fetch user's fee assignments
    const assignments = await db.select({
        assignment: feeAssignments,
        fee: fees,
        organization: {
            paystackSubaccountCode: organizations.paystackSubaccountCode
        }
    })
        .from(feeAssignments)
        .innerJoin(fees, eq(feeAssignments.feeId, fees.id))
        .leftJoin(organizations, eq(fees.organizationId, organizations.id))
        .where(eq(feeAssignments.userId, session.user.id))
        .orderBy(desc(feeAssignments.createdAt))

    const unpaidFees = assignments.filter(a => a.assignment.status === 'PENDING')
    const paidFees = assignments.filter(a => a.assignment.status === 'PAID')

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Payments & Levies</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Outstanding Dues</CardTitle>
                        <CardDescription>
                            Payments that require your attention.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unpaidFees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                                <p className="text-muted-foreground">You are all caught up! No outstanding dues.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {unpaidFees.map((item) => (
                                    <div key={item.assignment.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-lg">{item.fee.title}</h4>
                                                <Badge variant="outline">NGN {parseFloat(item.fee.amount.toString()).toLocaleString()}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{item.fee.description}</p>
                                            {item.fee.dueDate && (
                                                <div className="flex items-center text-xs text-red-500 font-medium">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    Due: {format(new Date(item.fee.dueDate), "PPP")}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full md:w-auto min-w-[300px]">
                                            <FeePaymentButton
                                                assignmentId={item.assignment.id}
                                                minAmount={parseFloat(item.fee.amount.toString())}
                                                email={session.user.email!}
                                                title={item.fee.title}
                                                subaccount={item.organization?.paystackSubaccountCode || undefined}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Recent successful payments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paidFees.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No payment history yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {paidFees.map((item) => (
                                    <div key={item.assignment.id} className="flex items-start space-x-3 text-sm border-b pb-3 last:border-0">
                                        <div className="mt-1">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium line-clamp-1">{item.fee.title}</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-muted-foreground">NGN {parseFloat(item.assignment.amountPaid?.toString() || "0").toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.assignment.paidAt ? format(new Date(item.assignment.paidAt), "MMM d, yyyy") : ""}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
