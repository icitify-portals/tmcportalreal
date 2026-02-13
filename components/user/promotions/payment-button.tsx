'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { verifyPromotionPayment } from "@/lib/actions/promotions"
import Script from "next/script"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
    amount: number
    email: string
    promotionId: string
    title: string
}

export function PromotionPaymentButton({ amount, email, promotionId, title }: PaymentButtonProps) {
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
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxx', // Fallback for dev
            email: email,
            amount: amount * 100, // Kobo
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    { display_name: "Payment For", variable_name: "title", value: `Promotion: ${title}` },
                    { display_name: "Promotion ID", variable_name: "promotion_id", value: promotionId },
                ]
            },
            onClose: () => {
                toast("Payment cancelled");
            },
            callback: async (response: any) => {
                setLoading(true);
                toast.info("Verifying payment...");

                try {
                    const result = await verifyPromotionPayment(promotionId, response.reference);
                    if (result.success) {
                        toast.success("Payment successful! Your promotion is now active.");
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
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pay ₦{mounted ? amount.toLocaleString() : "..."}
            </Button>
        </>
    )
}
