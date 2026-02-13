"use server"

import { db } from "@/lib/db"
import { payments, organizations } from "@/lib/db/schema"
import { getServerSession } from "@/lib/session"
import { desc, eq } from "drizzle-orm"

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
