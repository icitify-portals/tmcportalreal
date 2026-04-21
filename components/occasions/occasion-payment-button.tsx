'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { verifyOccasionPayment } from "@/lib/actions/occasions"
import Script from "next/script"
import { useRouter } from "next/navigation"

interface OccasionPaymentButtonProps {
    amount: number
    email: string
    requestId: string
    occasionType: string
}

export function OccasionPaymentButton({ amount, email, requestId, occasionType }: OccasionPaymentButtonProps) {
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
            amount: Math.round(amount * 100), 
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    { display_name: "Payment For", variable_name: "title", value: `Certificate Fee: ${occasionType}` },
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
                    const result = await verifyOccasionPayment(requestId, response.reference);
                    if (result.success) {
                        toast.success("Payment successful! Certificate is being generated.");
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
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pay Certificate Fee (₦{mounted ? amount.toLocaleString() : "..."})
            </Button>
        </>
    )
}
