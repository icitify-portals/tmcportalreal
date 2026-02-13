"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { recordFeePayment } from "@/lib/actions/fees"
import Script from "next/script"
import { useRouter } from "next/navigation"

interface FeePaymentButtonProps {
    minAmount: number
    email: string
    assignmentId: string
    title: string
    subaccount?: string
}

export function FeePaymentButton({ minAmount, email, assignmentId, title, subaccount }: FeePaymentButtonProps) {
    const [amount, setAmount] = useState<number>(minAmount)
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

        if (amount < minAmount) {
            toast.error(`Minimum payment amount is NGN ${minAmount}`)
            return
        }

        const paystack = (window as any).PaystackPop;
        if (!paystack) {
            toast.error("Payment system failed to load");
            return;
        }

        const config = {
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxx',
            email: email,
            amount: amount * 100, // Kobo
            currency: 'NGN',
            subaccount: subaccount, // Routing to jurisdiction
            metadata: {
                custom_fields: [
                    { display_name: "Payment For", variable_name: "title", value: `Levy: ${title}` },
                    { display_name: "Assignment ID", variable_name: "assignment_id", value: assignmentId },
                ]
            },
            onClose: () => {
                toast("Payment cancelled");
            },
            callback: async (response: any) => {
                setLoading(true);
                toast.info("Recording payment...");

                try {
                    const result = await recordFeePayment(assignmentId, amount, response.reference);
                    if (result.success) {
                        toast.success("Payment successful!");
                        router.refresh();
                    } else {
                        toast.error(result.error || "Failed to record payment");
                    }
                } catch (error) {
                    toast.error("An error occurred during recording");
                } finally {
                    setLoading(false);
                }
            }
        };

        paystack.setup(config).openIframe();
    };

    return (
        <div className="space-y-4">
            <Script
                src="https://js.paystack.co/v1/inline.js"
                onLoad={() => setScriptLoaded(true)}
                strategy="lazyOnload"
            />

            <div className="space-y-2">
                <Label htmlFor={`amount-${assignmentId}`} className="text-xs" suppressHydrationWarning>Amount to Pay (Min: NGN {mounted ? minAmount.toLocaleString() : "..."})</Label>
                <div className="flex space-x-2">
                    <Input
                        id={`amount-${assignmentId}`}
                        type="number"
                        min={minAmount}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button
                        onClick={handlePay}
                        disabled={loading || !scriptLoaded}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Pay Now
                    </Button>
                </div>
                {amount > minAmount && (
                    <p className="text-[10px] text-green-600 font-medium animate-pulse" suppressHydrationWarning>
                        Extra NGN {mounted ? (amount - minAmount).toLocaleString() : "..."} will be recorded as additional contribution.
                    </p>
                )}
            </div>
        </div>
    )
}
