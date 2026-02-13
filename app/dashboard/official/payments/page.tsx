import React from 'react'
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PaymentHistoryTable } from "@/components/dashboard/payment-history-table"
import { getPersonalPayments } from "@/lib/actions/payments"
import { CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OfficialPaymentsPage() {
    const response = await getPersonalPayments()
    const payments = response.success ? response.data : []

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <CreditCard className="h-8 w-8 text-primary" />
                        My Payments
                    </h1>
                    <p className="text-muted-foreground">Personal transaction history for your contributions.</p>
                </div>

                <PaymentHistoryTable payments={payments || []} />
            </div>
        </DashboardLayout>
    )
}
