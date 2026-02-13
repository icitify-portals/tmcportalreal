"use client"

import React from 'react'
import { format } from "date-fns"
import { Download, CreditCard, ExternalLink } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Payment {
    id: string
    amount: string
    currency: string
    status: string | null
    paymentType: string
    description: string | null
    paystackRef: string | null
    paidAt: Date | null
    createdAt: Date | null
    organization?: {
        name: string
    } | null
}

export function PaymentHistoryTable({ payments = [] }: { payments: any[] }) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (payments.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                    <CardTitle className="text-lg">No payments found</CardTitle>
                    <CardDescription>You haven't made any payments on the platform yet.</CardDescription>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="px-6">
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A complete list of all your payments and donations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-6 py-3">Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right px-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="px-6" suppressHydrationWarning>
                                    {payment.createdAt ? format(new Date(payment.createdAt), 'MMM d, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{payment.description || "No description"}</span>
                                        <span className="text-xs text-muted-foreground uppercase">{payment.organization?.name || "System"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] h-5">
                                        {payment.paymentType.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-bold" suppressHydrationWarning>
                                    {payment.currency} {mounted ? parseFloat(payment.amount).toLocaleString() : parseFloat(payment.amount).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={payment.status === "SUCCESS" ? "default" : "secondary"}
                                        className={payment.status === "SUCCESS" ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    {payment.status === "SUCCESS" && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/api/payments/receipt/${payment.id}`} target="_blank">
                                                <Download className="h-4 w-4 mr-1" />
                                                Receipt
                                            </a>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
