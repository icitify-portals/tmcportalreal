'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { verifyBurialPayment } from "@/lib/actions/burial"
import Script from "next/script"
import { useRouter } from "next/navigation"

interface BurialPaymentButtonProps {
    amount: number
    email: string
    requestId: string
    deceasedName: string
}

export function BurialPaymentButton({ amount, email, requestId, deceasedName }: BurialPaymentButtonProps) {
    const [loading, setLoading] = useState(false)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handlePay = () => {
        if (!scriptLoaded) {
            toast.error("Payment system loading, please try again in a moment.")
            return;
        }

        const paystack = (window as any).PaystackPop;
        if (!paystack) {
            toast.error("Payment system failed to load");
            return;
        }

        const config = {
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxx', 
            email: email,
            amount: Math.round(amount * 100), // Amount in kobo
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    { display_name: "Payment For", variable_name: "title", value: `Burial Verification: ${deceasedName}` },
                    { display_name: "Request ID", variable_name: "request_id", value: requestId },
                ]
            },
            onClose: () => {
                toast("Payment cancelled");
            },
            callback: async (response: any) => {
                setLoading(true);
                toast.info("Verifying payment...");

                try {
                    const result = await verifyBurialPayment(requestId, response.reference);
                    if (result.success) {
                        toast.success("Payment successful! Verification confirmed.");
                        router.refresh();
                    } else {
                        toast.error(result.error || "Payment verification failed");
                    }
                } catch (error) {
                    toast.error("An error occurred during verification");
                } finally {
                    setLoading(false);
                }
            }
        };

        paystack.setup(config).openIframe();
    };

    return (
        <>
            <Script
                src="https://js.paystack.co/v1/inline.js"
                onLoad={() => setScriptLoaded(true)}
                strategy="lazyOnload"
            />
            <Button
                onClick={handlePay}
                disabled={loading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-xl"
            >
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CreditCard className="mr-2 h-6 w-6" />}
                Pay Verification Fee (₦{mounted ? amount.toLocaleString() : "..."})
            </Button>
        </>
    )
}
