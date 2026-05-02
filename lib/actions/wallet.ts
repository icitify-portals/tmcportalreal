"use server"

import { db } from "@/lib/db"
import { wallets, walletTransactions, programmeRegistrations } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { initializePayment, verifyPayment } from "@/lib/payments"
import { revalidatePath } from "next/cache"

/**
 * Get or create wallet for the logged in user
 */
export async function getWallet() {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required" }
    }

    try {
        let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)

        if (!wallet) {
            // Create a wallet if it doesn't exist yet
            await db.insert(wallets).values({
                userId: session.user.id,
                balance: "0.00"
            })
            
            const [newWallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)
            wallet = newWallet
        }

        return { success: true, wallet }
    } catch (error) {
        console.error("Get Wallet Error:", error)
        return { success: false, error: "Failed to load wallet" }
    }
}

/**
 * Get transactions for the wallet
 */
export async function getWalletTransactions() {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required" }
    }

    try {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)
        if (!wallet) return { success: true, transactions: [] }

        const transactions = await db.select()
            .from(walletTransactions)
            .where(eq(walletTransactions.walletId, wallet.id))
            .orderBy(desc(walletTransactions.createdAt))

        return { success: true, transactions }
    } catch (error) {
        console.error("Get Transactions Error:", error)
        return { success: false, error: "Failed to load wallet transactions" }
    }
}

/**
 * Initialize a wallet deposit
 */
export async function initializeWalletFunding(amount: number) {
    const session = await getServerSession()
    if (!session?.user?.id || !session?.user?.email) {
        return { success: false, error: "Authentication required" }
    }

    if (amount <= 0) return { success: false, error: "Invalid deposit amount" }

    try {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)
        if (!wallet) {
            return { success: false, error: "No wallet initialized for user." }
        }

        const response = await initializePayment({
            email: session.user.email,
            amount: amount,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/member`,
            metadata: {
                walletId: wallet.id,
                userId: session.user.id,
                type: "WALLET_DEPOSIT"
            }
        })

        return response
    } catch (error) {
        console.error("Wallet Init Payment Error:", error)
        return { success: false, error: "Deposit initialization failed" }
    }
}

/**
 * Verify wallet funding via Paystack
 */
export async function verifyWalletFunding(reference: string) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required" }
    }

    try {
        const response = await verifyPayment(reference)
        if (response.success && response.data?.status === "success") {
            const amountInNaira = parseFloat(response.data.amount?.toString() || "0")

            const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)
            if (!wallet) return { success: false, error: "Wallet not found" }

            // Check if transaction has already been applied
            const [existingTx] = await db.select().from(walletTransactions)
                .where(and(eq(walletTransactions.walletId, wallet.id), eq(walletTransactions.reference, reference)))
                .limit(1)

            if (existingTx) {
                return { success: true, message: "Funding already recorded." }
            }

            const currentBalance = parseFloat(wallet.balance || "0")
            const newBalance = currentBalance + amountInNaira

            // Perform in transaction to keep database in sync
            await db.transaction(async (tx) => {
                await tx.update(wallets)
                    .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                    .where(eq(wallets.id, wallet.id))

                await tx.insert(walletTransactions).values({
                    walletId: wallet.id,
                    type: "CREDIT",
                    amount: amountInNaira.toFixed(2),
                    description: "Deposit via Paystack",
                    reference: reference
                })
            })

            revalidatePath("/dashboard/member")
            return { success: true, message: "Wallet balance updated!" }
        }

        return { success: false, error: "Payment verification failed" }
    } catch (error) {
        console.error("Wallet Verify Error:", error)
        return { success: false, error: "Wallet verify failed" }
    }
}

/**
 * Pay for programme via Wallet balance
 */
export async function payWithWalletBalance(registrationId: string, customAmount?: number) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required" }
    }

    try {
        const [reg] = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.id, registrationId)).limit(1)
        if (!reg) return { success: false, error: "Registration record not found" }

        // Fetch full amount for this registration's programme
        const [prog] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id)).limit(1)
        if (!prog) return { success: false, error: "No wallet found" }

        // In a clear way, query details
        const results = await db.query.programmeRegistrations.findFirst({
            where: eq(programmeRegistrations.id, registrationId),
            with: {
                programme: true
            }
        }) as any

        if (!results || !results.programme) return { success: false, error: "Programme not found" }

        const totalAmount = parseFloat(results.programme.amount || "0")
        const paidAlready = parseFloat(results.amountPaid || "0")
        const balance = Math.max(0, totalAmount - paidAlready)

        let spendAmount = totalAmount
        if (customAmount && customAmount > 0) {
            spendAmount = customAmount
        }

        if (spendAmount <= 0) return { success: false, error: "Invalid deduction amount" }
        if (spendAmount > balance) {
            return { success: false, error: `Payment amount exceeds the remaining balance of ₦${balance}` }
        }

        const walletBalance = parseFloat(prog.balance || "0")
        if (walletBalance < spendAmount) {
            return { success: false, error: "Insufficient wallet balance" }
        }

        // Apply deduction in database
        const newWalletBalance = walletBalance - spendAmount
        const newPaidAmount = paidAlready + spendAmount
        const newStatus = newPaidAmount >= totalAmount ? 'PAID' : 'PARTIALLY_PAID'

        await db.transaction(async (tx) => {
            await tx.update(wallets)
                .set({ balance: newWalletBalance.toFixed(2), updatedAt: new Date() })
                .where(eq(wallets.id, prog.id))

            await tx.insert(walletTransactions).values({
                walletId: prog.id,
                type: "DEBIT",
                amount: spendAmount.toFixed(2),
                description: `Programme Payment: ${results.programme.title}`,
                reference: `WALLET-${Date.now()}`
            })

            await tx.update(programmeRegistrations)
                .set({
                    amountPaid: newPaidAmount.toFixed(2),
                    status: newStatus
                })
                .where(eq(programmeRegistrations.id, registrationId))
        })

        revalidatePath("/dashboard/member")
        revalidatePath("/programmes")
        return { success: true, message: "Payment was successful from wallet" }
    } catch (error) {
        console.error("Wallet Payment Error:", error)
        return { success: false, error: "Deduction failed from wallet balance" }
    }
}
