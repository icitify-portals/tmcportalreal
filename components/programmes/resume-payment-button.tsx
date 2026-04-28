"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function ResumePaymentButton({ registrationId }: { registrationId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handlePayment() {
        setIsLoading(true)
        try {
            const result = await initializeProgrammeRegistrationPayment(registrationId)
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
        <Button 
            onClick={handlePayment}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <CreditCard className="w-4 h-4 mr-2" />
            )}
            Pay Now to Complete Registration
        </Button>
    )
}
