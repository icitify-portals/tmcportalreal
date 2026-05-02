import { getWallet, getWalletTransactions } from "@/lib/actions/wallet"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WalletDashboardClient } from "@/components/wallet/wallet-dashboard-client"

export const dynamic = "force-dynamic"

export default async function MemberWalletPage() {
    const walletRes = await getWallet()
    const txsRes = await getWalletTransactions()

    const wallet = walletRes.success ? walletRes.wallet : null
    const transactions = txsRes.success ? txsRes.transactions : []

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-emerald-100 tracking-tight">Your Wallet</h1>
                    <p className="text-muted-foreground mt-1 text-emerald-200/60">
                        Fund and use your wallet for convenient, hassle-free programme registration payments.
                    </p>
                </div>

                <WalletDashboardClient 
                    wallet={wallet as any} 
                    transactions={transactions as any} 
                />
            </div>
        </DashboardLayout>
    )
}
