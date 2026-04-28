"use server"

import { db } from "@/lib/db"
import { payments, organizations } from "@/lib/db/schema"
import { getServerSession } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { verifyPayment, updatePaymentStatus } from "@/lib/payments"
import { revalidatePath } from "next/cache"

export async function getPersonalPayments() {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const data = await db.query.payments.findMany({
            where: eq(payments.userId, session.user.id),
            with: {
                organization: {
                    columns: {
                        name: true
                    }
                }
            },
            orderBy: [desc(payments.createdAt)]
        })

        return { success: true, data }
    } catch (error: any) {
        console.error("Fetch personal payments error:", error)
        return { success: false, error: error.message || "Failed to fetch payments" }
    }
}

export async function syncGeneralPayments() {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        // Fetch pending or failed payments that have a reference
        const pendingPayments = await db.query.payments.findMany({
            where: (payments, { and, ne, isNotNull }) => and(
                ne(payments.status, "SUCCESS"),
                isNotNull(payments.paystackRef)
            ),
            limit: 20
        })

        if (pendingPayments.length === 0) {
            return { success: true, count: 0, message: "No payments to sync" }
        }

        let syncCount = 0
        for (const payment of pendingPayments) {
            if (!payment.paystackRef) continue

            const verifyResult = await verifyPayment(payment.paystackRef)
            if (verifyResult.success && verifyResult.data.status === "success") {
                await updatePaymentStatus(payment.id, "SUCCESS", verifyResult.data)
                syncCount++
            } else if (verifyResult.data?.status === "failed") {
                await updatePaymentStatus(payment.id, "FAILED", verifyResult.data)
            }
        }

        revalidatePath("/dashboard/admin/finance")
        return { success: true, count: syncCount, totalChecked: pendingPayments.length }
    } catch (error: any) {
        console.error("Sync payments error:", error)
        return { success: false, error: error.message || "Sync failed" }
    }
}
