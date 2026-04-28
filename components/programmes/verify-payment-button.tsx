"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"
import { verifyProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function VerifyPaymentStatusButton({ registrationId, reference }: { registrationId: string, reference?: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleVerify() {
        if (!reference) {
            toast.error("No payment reference found. Please proceed to pay.")
            return
        }
        setIsLoading(true)
        try {
            const res = await verifyProgrammeRegistrationPayment(registrationId, reference)
            if (res.success) {
                toast.success("Payment verified successfully!")
                window.location.reload()
            } else {
                toast.error(res.error || "Payment not found or still pending.")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            className="border-green-600 text-green-700 hover:bg-green-50 font-bold" 
            onClick={handleVerify}
            disabled={isLoading || !reference}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            I have already paid (Sync)
        </Button>
    )
}
