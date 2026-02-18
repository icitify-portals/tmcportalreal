
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { verifyCampaignDonation } from "@/lib/actions/donation"
import { toast } from "sonner"
import script from "next/script"

interface DonationWidgetProps {
    campaignId: string
    suggestedAmounts?: number[]
    allowCustomAmount?: boolean
}

export function DonationWidget({ campaignId, suggestedAmounts = [1000, 5000, 10000, 50000], allowCustomAmount = true }: DonationWidgetProps) {
    const [amount, setAmount] = useState<number>(suggestedAmounts[0] || 1000)
    const [customAmount, setCustomAmount] = useState<string>("")
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<"preset" | "custom">("preset")
    const [mounted, setMounted] = useState(false)
    const [scriptLoaded, setScriptLoaded] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDonate = async () => {
        if (!email) {
            toast.error("Please enter your email address")
            return
        }

        const finalAmount = mode === "preset" ? amount : parseFloat(customAmount)
        if (!finalAmount || finalAmount < 100) {
            toast.error("Minimum donation is ₦100")
            return
        }

        if (!scriptLoaded) {
            toast.error("Payment system loading, please wait...")
            return
        }

        const paystack = (window as any).PaystackPop
        if (!paystack) {
            toast.error("Payment system failed to load")
            return
        }

        setIsLoading(true)

        const config = {
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxx',
            email: email,
            amount: finalAmount * 100, // in kobo
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    { display_name: "Campaign ID", variable_name: "campaign_id", value: campaignId },
                    { display_name: "Donor Name", variable_name: "donor_name", value: isAnonymous ? "Anonymous" : name }
                ]
            },
            onClose: () => {
                toast.info("Payment cancelled")
                setIsLoading(false)
            },
            callback: async (response: any) => {
                // response: { reference, message, status, trans, transaction, trxref }
                try {
                    toast.info("Verifying payment...")
                    const result = await verifyCampaignDonation(response.reference, campaignId)

                    if (result.success) {
                        toast.success("Donation successful! Thank you.")
                        // Optionally redirect or reset
                        setEmail("")
                        setName("")
                        setCustomAmount("")
                    } else {
                        toast.error(result.error || "Payment verified but recording failed")
                    }
                } catch (err) {
                    console.error(err)
                    toast.error("An error occurred during verification")
                } finally {
                    setIsLoading(false)
                }
            }
        }

        paystack.setup(config).openIframe()
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-6">
            <Script src="https://js.paystack.co/v1/inline.js" onReady={() => setScriptLoaded(true)} />

            <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    Donate to this Cause
                </h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {suggestedAmounts.map((amt) => (
                        <Button
                            key={amt}
                            variant={mode === "preset" && amount === amt ? "default" : "outline"}
                            onClick={() => { setAmount(amt); setMode("preset"); }}
                            className="w-full"
                        >
                            <span suppressHydrationWarning>
                                ₦{amt.toLocaleString()}
                            </span>
                        </Button>
                    ))}
                </div>

                {allowCustomAmount && (
                    <div className="space-y-2">
                        <Button
                            variant={mode === "custom" ? "default" : "secondary"}
                            onClick={() => setMode("custom")}
                            className="w-full text-xs h-8 mb-2"
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
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name (Optional)</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} disabled={isAnonymous} />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    <Label htmlFor="anonymous">Donate anonymously</Label>
                </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleDonate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Donate ₦{mounted ? (mode === 'preset' ? amount : parseFloat(customAmount || "0")).toLocaleString() : "..."}
            </Button>
        </div>
    )
}
