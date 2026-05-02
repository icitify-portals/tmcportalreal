"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, Wallet } from "lucide-react"
import { initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { payWithWalletBalance } from "@/lib/actions/wallet"
import { toast } from "sonner"

export function ResumePaymentButton({ 
    registrationId,
    balance,
    minInstallmentAmount
}: { 
    registrationId: string,
    balance?: number,
    minInstallmentAmount?: number
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [isWalletLoading, setIsWalletLoading] = useState(false)
    const [amount, setAmount] = useState<string>(balance ? balance.toString() : "")

    async function handlePayment() {
        setIsLoading(true)
        try {
            const result = await initializeProgrammeRegistrationPayment(registrationId, parseFloat(amount || "0"))
            if (result.success && result.authorizationUrl) {
                window.location.href = result.authorizationUrl
            } else {
                toast.error(result.error || "Failed to initialize payment")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleWalletPayment() {
        setIsWalletLoading(true)
        try {
            const result = await payWithWalletBalance(registrationId, parseFloat(amount || "0"))
            if (result.success) {
                toast.success(result.message || "Payment from wallet balance successful!")
                window.location.reload()
            } else {
                toast.error(result.error || "Failed to pay with wallet")
            }
        } catch (error) {
            toast.error("An unexpected error occurred with wallet balance")
        } finally {
            setIsWalletLoading(false)
        }
    }

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-white shadow-sm max-w-sm mx-auto">
            {balance && balance > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider text-left">
                        Payment Amount (₦)
                    </label>
                    <input 
                        type="number"
                        min={minInstallmentAmount || 1}
                        max={balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border p-2 rounded-md font-medium bg-white text-gray-900"
                        placeholder={`Enter amount to pay (Balance: ₦${balance})`}
                    />
                    {minInstallmentAmount && balance > minInstallmentAmount && (
                        <p className="text-[10px] text-green-600 text-left">Minimum installment: ₦{minInstallmentAmount}</p>
                    )}
                </div>
            )}
            <div className="flex flex-col gap-2">
                <Button 
                    onClick={handlePayment}
                    disabled={isLoading || isWalletLoading || (!!balance && parseFloat(amount || "0") <= 0)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {balance && balance > 0 ? `Direct Paystack ₦${amount || balance}` : "Proceed to Payment"}
                </Button>
                <Button 
                    onClick={handleWalletPayment}
                    disabled={isLoading || isWalletLoading || (!!balance && parseFloat(amount || "0") <= 0)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                    {isWalletLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                    )}
                    {balance && balance > 0 ? `Pay with Wallet ₦${amount || balance}` : "Use Wallet Balance"}
                </Button>
            </div>
        </div>
    )
}

export function RefreshButton() {
    return (
        <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-gray-400 hover:text-gray-600"
        >
            Refresh Page after payment
        </button>
    )
}
