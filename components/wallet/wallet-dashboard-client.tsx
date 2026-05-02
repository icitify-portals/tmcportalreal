"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { initializeWalletFunding, verifyWalletFunding } from "@/lib/actions/wallet"
import { format } from "date-fns"

interface Tx {
    id: string
    type: string
    amount: string
    description: string
    reference: string
    createdAt: string
}

export function WalletDashboardClient({
    wallet,
    transactions,
}: {
    wallet: { id: string, balance: string } | null
    transactions: Tx[]
}) {
    const [amount, setAmount] = useState("")
    const [isFunding, setIsFunding] = useState(false)
    const [openModal, setOpenModal] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [txRef, setTxRef] = useState("")

    const handleFundWallet = async (e: React.FormEvent) => {
        e.preventDefault()
        const depositAmount = parseFloat(amount)
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        setIsFunding(true)
        try {
            const res = await initializeWalletFunding(depositAmount)
            if (res.success && res.authorizationUrl) {
                toast.success("Redirecting to Paystack...")
                window.location.href = res.authorizationUrl
            } else if (res.success && res.reference) {
                // Testing reference
                setTxRef(res.reference)
                setOpenModal(false)
                toast.success("Initialization reference created. Verifying...")
                await handleVerify(res.reference)
            } else {
                toast.error(res.error || "Payment initialization failed")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to process request")
        } finally {
            setIsFunding(false)
        }
    }

    const handleVerify = async (ref: string) => {
        setVerifying(true)
        try {
            const res = await verifyWalletFunding(ref)
            if (res.success) {
                toast.success(res.message || "Wallet funded successfully")
                setAmount("")
                window.location.reload()
            } else {
                toast.error(res.error || "Failed to verify payment")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error verifying payment")
        } finally {
            setVerifying(false)
        }
    }

    const currentBalance = parseFloat(wallet?.balance || "0")

    return (
        <div className="space-y-6">
            <Card className="bg-emerald-950/20 backdrop-blur-md border border-emerald-800/40 text-emerald-100 overflow-hidden shadow-2xl relative">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-700/50">
                                <Wallet className="h-6 w-6 text-emerald-300" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-emerald-200/70">Wallet Balance</CardTitle>
                                <CardDescription className="text-emerald-100/60 text-xs">Used to complete registration payments instantly</CardDescription>
                            </div>
                        </div>

                        <Dialog open={openModal} onOpenChange={setOpenModal}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-emerald-50 border border-emerald-400/30 flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Fund Wallet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-emerald-950 border border-emerald-800 text-emerald-100 sm:max-w-md">
                                <form onSubmit={handleFundWallet}>
                                    <DialogHeader>
                                        <DialogTitle className="text-emerald-100 font-black tracking-tight text-xl">Fund Your Wallet</DialogTitle>
                                        <DialogDescription className="text-emerald-300/70">
                                            Enter the exact amount to fund your balance via Paystack.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="my-6 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs uppercase tracking-wider font-bold text-emerald-200/80">Amount (NGN)</label>
                                            <Input
                                                type="number"
                                                min="100"
                                                placeholder="e.g 5000"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="bg-emerald-950/40 border-emerald-800 text-emerald-100 focus:border-emerald-600"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            type="submit" 
                                            disabled={isFunding}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-emerald-50 border border-emerald-400/30 font-bold"
                                        >
                                            {isFunding ? "Initializing..." : "Proceed to Paystack"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <div className="text-4xl md:text-5xl font-black text-emerald-50 tracking-tight flex items-baseline gap-2">
                        <span>₦{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-emerald-100">Transaction History</h2>
                    {txRef && (
                        <Button
                            variant="outline"
                            onClick={() => handleVerify(txRef)}
                            disabled={verifying}
                            className="text-xs border-emerald-800 text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-100 flex items-center gap-2"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin" : ""}`} />
                            {verifying ? "Verifying..." : "Refresh Status"}
                        </Button>
                    )}
                </div>

                {transactions.length === 0 ? (
                    <div className="border border-dashed border-emerald-800/50 rounded-xl p-8 text-center bg-emerald-950/10 text-emerald-300/40">
                        No transactions recorded yet.
                    </div>
                ) : (
                    <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl overflow-hidden shadow-xl">
                        <div className="divide-y divide-emerald-800/40">
                            {transactions.map((tx) => {
                                const isCredit = tx.type === "CREDIT"
                                return (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-emerald-950/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl border ${isCredit ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400" : "bg-red-950/50 border-red-500/30 text-red-400"}`}>
                                                {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-emerald-100 text-sm tracking-tight">{tx.description || "Wallet Payment"}</p>
                                                <p className="text-xs text-emerald-200/50 mt-0.5">
                                                    {tx.createdAt ? format(new Date(tx.createdAt), "MMM d, yyyy h:mm a") : "Just now"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-base ${isCredit ? "text-emerald-300" : "text-red-300"}`}>
                                                {isCredit ? "+" : "-"}₦{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[10px] text-emerald-300/40 font-mono mt-0.5 uppercase tracking-wide">
                                                {tx.reference?.slice(0, 12)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
