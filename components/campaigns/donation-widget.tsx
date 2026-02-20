
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { verifyCampaignDonation } from "@/lib/actions/donation"
import { toast } from "sonner"
import { Loader2, Heart } from "lucide-react"
import Script from "next/script"

interface DonationWidgetProps {
    campaignId: string
    suggestedAmounts?: number[]
    allowCustomAmount?: boolean
}

declare global {
    interface Window {
        PaystackPop: {
            newTransaction: (config: Record<string, unknown>) => void
        }
    }
}

export function DonationWidget({
    campaignId,
    suggestedAmounts = [1000, 5000, 10000, 50000],
    allowCustomAmount = true,
}: DonationWidgetProps) {
    const [amount, setAmount] = useState<number>(suggestedAmounts[0] || 1000)
    const [customAmount, setCustomAmount] = useState<string>("")
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<"preset" | "custom">("preset")
    const [mounted, setMounted] = useState(false)
    const [scriptReady, setScriptReady] = useState(false)

    useEffect(() => {
        setMounted(true)
        // In case the script was already loaded (e.g. navigating back to page)
        if (typeof window !== "undefined" && window.PaystackPop) {
            setScriptReady(true)
        }
    }, [])

    const handleDonate = () => {
        if (!email) {
            toast.error("Please enter your email address")
            return
        }

        const finalAmount = mode === "preset" ? amount : parseFloat(customAmount)
        if (!finalAmount || finalAmount < 100) {
            toast.error("Minimum donation is ₦100")
            return
        }

        if (!scriptReady || !window.PaystackPop) {
            toast.error("Payment system is still loading. Please try again in a moment.")
            return
        }

        setIsLoading(true)

        window.PaystackPop.newTransaction({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
            email,
            amount: finalAmount * 100, // kobo
            currency: "NGN",
            metadata: {
                custom_fields: [
                    {
                        display_name: "Campaign ID",
                        variable_name: "campaign_id",
                        value: campaignId,
                    },
                    {
                        display_name: "Donor Name",
                        variable_name: "donor_name",
                        value: isAnonymous ? "Anonymous" : name || "Anonymous",
                    },
                ],
            },
            onSuccess: (transaction: { reference: string }) => {
                toast.info("Verifying payment…")
                verifyCampaignDonation(transaction.reference, campaignId)
                    .then((result) => {
                        if (result.success) {
                            toast.success("Donation successful! Jazakallahu khairan 🎉")
                            setEmail("")
                            setName("")
                            setCustomAmount("")
                            setMode("preset")
                            setAmount(suggestedAmounts[0] || 1000)
                        } else {
                            toast.error(result.error || "Payment recorded but verification failed")
                        }
                    })
                    .catch(() => toast.error("An error occurred during verification"))
                    .finally(() => setIsLoading(false))
            },
            onCancel: () => {
                toast.info("Payment cancelled")
                setIsLoading(false)
            },
        })
    }

    return (
        <div className="space-y-6">
            {/* Load Paystack v2 inline.js — no <form> wrapper required */}
            <Script
                src="https://js.paystack.co/v2/inline.js"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    Donate to this Cause
                </h3>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-2 gap-2">
                {suggestedAmounts.map((amt) => (
                    <Button
                        key={amt}
                        variant={mode === "preset" && amount === amt ? "default" : "outline"}
                        onClick={() => {
                            setAmount(amt)
                            setMode("preset")
                        }}
                        className="w-full"
                    >
                        <span suppressHydrationWarning>₦{amt.toLocaleString()}</span>
                    </Button>
                ))}
            </div>

            {/* Custom amount */}
            {allowCustomAmount && (
                <div className="space-y-2">
                    <Button
                        variant={mode === "custom" ? "default" : "secondary"}
                        onClick={() => setMode("custom")}
                        className="w-full text-xs h-8"
                    >
                        Enter Custom Amount
                    </Button>
                    {mode === "custom" && (
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                            <Input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="pl-7"
                                min={100}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Donor details */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="donor-email">Email Address *</Label>
                    <Input
                        id="donor-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="donor-name">Full Name (Optional)</Label>
                    <Input
                        id="donor-name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isAnonymous}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    <Label htmlFor="anonymous">Donate anonymously</Label>
                </div>
            </div>

            <Button
                className="w-full"
                size="lg"
                onClick={handleDonate}
                disabled={isLoading || !scriptReady}
            >
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                    <>Donate ₦{mounted ? (mode === "preset" ? amount : parseFloat(customAmount || "0")).toLocaleString() : "…"}</>
                )}
            </Button>

            {!scriptReady && mounted && (
                <p className="text-xs text-center text-muted-foreground">Loading payment system…</p>
            )}
        </div>
    )
}
