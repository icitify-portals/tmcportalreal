"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes"
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
            <Button 
                onClick={handlePayment}
                disabled={isLoading || (!!balance && parseFloat(amount || "0") <= 0)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                )}
                {balance && balance > 0 ? `Pay ₦${amount || balance}` : "Proceed to Payment"}
            </Button>
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
