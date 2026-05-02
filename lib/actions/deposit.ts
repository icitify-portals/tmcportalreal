"use server"

import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { wallets } from "@/lib/db/schema"

export async function depositAction(userId: string, amount: number, reference: string) {
    try {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
        if (!wallet) return { success: false, error: "Wallet not found" }

        const currentBalance = parseFloat(wallet.balance || "0")
        const newBalance = currentBalance + amount

        await db.update(wallets)
            .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(wallets.id, wallet.id))

        return { success: true }
    } catch (error) {
        console.error("Deposit error:", error)
        return { success: false, error: "Failed to deposit" }
    }
}
