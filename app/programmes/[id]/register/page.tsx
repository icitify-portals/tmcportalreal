"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { registerForProgramme, initializeProgrammeRegistrationPayment, getProgrammeDetailsAction } from "@/lib/actions/programmes"
import { payWithWalletBalance } from "@/lib/actions/wallet"
import { toast } from "sonner"
import { Loader2, UserPlus, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react"
import { nigerianStatesAndLgas } from "@/lib/nigeria-data"
import { countries } from "@/lib/countries"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function RegistrationContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()
    
    const programmeId = params.id as string
    const waiverCode = searchParams.get("waiver")
    
    const [programme, setProgramme] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "WALLET">("PAYSTACK")
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        gender: "MALE",
        address: "",
        country: "Nigeria",
        state: "",
        lga: "",
        registrationTier: "",
        amountPaid: ""
    })

    useEffect(() => {
        async function loadProgramme() {
            try {
                const result = await getProgrammeDetailsAction(programmeId)
                if (result.success) {
                    setProgramme(result.programme)
                } else {
                    toast.error("Programme not found")
                }
            } catch (error) {
                toast.error("Failed to load programme")
            } finally {
                setIsLoading(false)
            }
        }
        loadProgramme()
    }, [programmeId])

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || "",
                email: session.user.email || "",
                phone: (session.user as any).phone || ""
            }))
        }
    }, [session])

    const selectedStateData = nigerianStatesAndLgas.find(s => s.state === formData.state)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // Enforce minimum payment logically on frontend too — early bird aware
            let baseAmount = effectiveNormal
            if (formData.registrationTier && programme.pricingTiers) {
                 const tiers: any = typeof programme.pricingTiers === 'string' ? JSON.parse(programme.pricingTiers) : programme.pricingTiers;
                 let tierAmount = 0;
                 if (tiers?.[formData.registrationTier]) {
                     tierAmount = Number(tiers[formData.registrationTier]);
                 } else if (tiers?.individuals && tiers.individuals[formData.registrationTier]) {
                     tierAmount = Number(tiers.individuals[formData.registrationTier]);
                 } else if (tiers?.corporate && tiers.corporate[formData.registrationTier]) {
                     tierAmount = Number(tiers.corporate[formData.registrationTier]);
                 }
                 
                 if (tierAmount > 0) baseAmount = tierAmount;
            }

            let requiredMin = baseAmount;
            if (programme.allowInstallments) {
                const minInstallment = parseFloat(programme.minInstallmentAmount || "0");
                // If a tier is selected and minInstallment is higher than tier's baseAmount, allow down to baseAmount.
                // Usually minInstallment applies globally, but it shouldn't exceed the tier's price.
                if (minInstallment > 0 && minInstallment < baseAmount) {
                    requiredMin = minInstallment;
                }
            }
            
            const userAmount = formData.amountPaid ? parseFloat(formData.amountPaid) : baseAmount;
            
            if (programme.paymentRequired && userAmount < requiredMin) {
                toast.error(`Minimum payment for this tier/installment is ₦${requiredMin}`);
                setIsSubmitting(false);
                return;
            }

            const submissionData = { ...formData, amountPaid: userAmount };

            const result = await registerForProgramme(programmeId, submissionData, waiverCode || undefined)

            if (result.success) {
                if (result.isWaiver) {
                    toast.success("Registration successful! Offline payment verified.")
                    router.push(`/dashboard/member/programmes`) // Or a success page
                } else if (result.paymentRequired) {
                    const payAmount = userAmount;
                    if (session && paymentMethod === "WALLET") {
                        toast.info("Processing wallet payment...")
                        const payResult = await payWithWalletBalance(result.registrationId!, payAmount)
                        if (payResult.success) {
                            toast.success("Wallet payment successful")
                            router.push(`/dashboard/member/programmes`)
                        } else {
                            toast.error(payResult.error || "Wallet payment failed")
                        }
                    } else {
                        toast.info("Registration saved. Redirecting to payment...")
                        const payResult = await initializeProgrammeRegistrationPayment(result.registrationId!, payAmount)
                        if (payResult.success && payResult.authorizationUrl) {
                            window.location.href = payResult.authorizationUrl
                        } else {
                            toast.error(payResult.error || "Failed to initialize payment")
                        }
                    }
                } else {
                    toast.success("Successfully registered for programme")
                    router.push(`/dashboard/member/programmes`)
                }
            } else if (result.registrationId) {
                if (result.status === 'PARTIALLY_PAID' || result.status === 'PENDING_PAYMENT') {
                    toast.info(result.error || "Incomplete registration found. Redirecting to payment slip...")
                } else {
                    toast.info(result.error || "You are already registered.")
                }
                router.push(`/programmes/registrations/${result.registrationId}/slip`)
            } else {
                toast.error(result.error || "Failed to register")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading programme details...</p>
            </div>
        )
    }

    if (!programme) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Programme Not Found</h1>
                <p className="text-muted-foreground mt-2">The programme you are looking for does not exist or has been removed.</p>
                <Button className="mt-6" asChild>
                    <a href="/programmes">Browse Programmes</a>
                </Button>
            </div>
        )
    }

    const isWaiverActive = waiverCode && programme.waiverCode && waiverCode === programme.waiverCode
    const isEarlyBird = programme?.earlyBirdAmount && programme?.earlyBirdDeadline && new Date() <= new Date(programme.earlyBirdDeadline)
    const effectiveNormal = isEarlyBird ? Number(programme.earlyBirdAmount) : Number(programme.amount || 0)

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Card className="border-t-4 border-t-green-600 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-green-900">{programme.title}</CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Programme Registration
                            </CardDescription>
                        </div>
                    </div>
                    {isWaiverActive && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800">Priority Registration Active</p>
                                <p className="text-xs text-emerald-700">Your offline payment has been pre-verified. No further payment is required.</p>
                            </div>
                        </div>
                    )}
                    {programme?.paymentRequired && isEarlyBird && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm font-bold text-amber-800">Early Bird ₦{Number(programme.earlyBirdAmount).toLocaleString()} till {new Date(programme.earlyBirdDeadline).toLocaleDateString()}</p>
                            <p className="text-xs text-amber-700">Normal ₦{Number(programme.amount).toLocaleString()} from {new Date(new Date(programme.earlyBirdDeadline).getTime()+24*60*60*1000).toLocaleDateString()}.</p>
                        </div>
                    )}
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {sessionStatus === 'loading' ? (
                            <div className="h-20 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                        ) : session ? (
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    Registering as <strong className="font-bold">{session.user.name}</strong> ({session.user.email}). 
                                    Your profile details will be automatically linked.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                                        <Input 
                                            id="name" 
                                            placeholder="Enter your full name"
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-xs font-bold uppercase text-gray-500">Phone Number</Label>
                                        <Input 
                                            id="phone" 
                                            placeholder="080XXXXXXXX"
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500 block mb-3">Gender</Label>
                                        <RadioGroup 
                                            defaultValue="MALE" 
                                            className="flex gap-4"
                                            onValueChange={(v) => setFormData({...formData, gender: v})}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="MALE" id="male" />
                                                <Label htmlFor="male" className="text-sm cursor-pointer">Male</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="FEMALE" id="female" />
                                                <Label htmlFor="female" className="text-sm cursor-pointer">Female</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-xs font-bold uppercase text-gray-500">Address</Label>
                                    <Textarea 
                                        id="address" 
                                        placeholder="Residential address"
                                        value={formData.address} 
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Country</Label>
                                        <Select 
                                            value={formData.country} 
                                            onValueChange={(v) => setFormData({...formData, country: v, state: "", lga: ""})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countries.map(c => (
                                                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.country === "Nigeria" ? (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500">State</Label>
                                            <Select 
                                                value={formData.state} 
                                                onValueChange={(v) => setFormData({...formData, state: v, lga: ""})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select State" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {nigerianStatesAndLgas.map(s => (
                                                        <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-xs font-bold uppercase text-gray-500">State/Province</Label>
                                            <Input 
                                                id="state" 
                                                value={formData.state} 
                                                onChange={(e) => setFormData({...formData, state: e.target.value})}
                                                placeholder="Enter State/Province"
                                            />
                                        </div>
                                    )}
                                </div>

                                {formData.country === "Nigeria" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">LGA</Label>
                                        <Select 
                                            value={formData.lga} 
                                            onValueChange={(v) => setFormData({...formData, lga: v})}
                                            disabled={!formData.state}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select LGA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedStateData?.lgas.map(lga => (
                                                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {(() => {
                            const pricingTiers = programme?.pricingTiers ? (typeof programme.pricingTiers === 'string' ? JSON.parse(programme.pricingTiers) : programme.pricingTiers) : null;
                            let baseAmount = effectiveNormal;
                            if (pricingTiers && formData.registrationTier) {
                                if (pricingTiers?.[formData.registrationTier]) {
                                    baseAmount = Number(pricingTiers[formData.registrationTier]);
                                } else if (pricingTiers?.individuals?.[formData.registrationTier]) {
                                    baseAmount = Number(pricingTiers.individuals[formData.registrationTier]);
                                } else if (pricingTiers?.corporate?.[formData.registrationTier]) {
                                    baseAmount = Number(pricingTiers.corporate[formData.registrationTier]);
                                }
                            }

                            let requiredMin = baseAmount;
                            if (programme?.allowInstallments) {
                                const minInst = parseFloat(programme?.minInstallmentAmount || "0");
                                if (minInst > 0 && minInst < baseAmount) {
                                    requiredMin = minInst;
                                }
                            }

                            return (
                                <>
                                    {pricingTiers && Object.keys(pricingTiers).length > 0 && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <Label className="text-xs font-bold uppercase text-gray-500">Registration Tier / Category</Label>
                                            <Select 
                                                value={formData.registrationTier} 
                                                onValueChange={(v) => {
                                                    setFormData({...formData, registrationTier: v === "none" ? "" : v})
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Registration Tier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Standard (₦{programme?.amount || "0"})</SelectItem>
                                                    {Object.keys(pricingTiers).filter(k => k !== 'individuals' && k !== 'corporate').map(k => (
                                                        <SelectItem key={k} value={k}>{k} - ₦{pricingTiers[k]}</SelectItem>
                                                    ))}
                                                    {pricingTiers.individuals && Object.keys(pricingTiers.individuals).map(k => (
                                                        <SelectItem key={k} value={k}>{k} - ₦{pricingTiers.individuals[k]}</SelectItem>
                                                    ))}
                                                    {pricingTiers.corporate && Object.keys(pricingTiers.corporate).map(k => (
                                                        <SelectItem key={k} value={k}>{k} - ₦{pricingTiers.corporate[k]}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {!isWaiverActive && programme?.paymentRequired && (
                                        <div className="space-y-2 mt-4">
                                            <Label className="text-xs font-bold uppercase text-gray-500">Amount to Pay (₦)</Label>
                                            <Input 
                                                type="number"
                                                min={requiredMin}
                                                step="0.01"
                                                placeholder={`Minimum: ₦${requiredMin}`}
                                                value={formData.amountPaid}
                                                onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                                                required
                                                className="border-green-300 focus-visible:ring-green-500 bg-green-50/20"
                                            />
                                            <p className="text-[10px] text-gray-500 font-medium">You must pay at least <strong className="text-black">₦{requiredMin}</strong>. {programme.allowInstallments ? "Installments are allowed." : "You are free to pay more."}</p>
                                        </div>
                                    )}
                                    
                                    {!isWaiverActive && programme.paymentRequired && requiredMin > 0 && session && (
                                        <div className="p-4 border rounded-lg bg-emerald-50/30 space-y-3 mt-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">Payment Method</Label>
                                            <RadioGroup 
                                                defaultValue="PAYSTACK" 
                                                onValueChange={(v: "PAYSTACK" | "WALLET") => setPaymentMethod(v)}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="PAYSTACK" id="method-paystack" />
                                                    <Label htmlFor="method-paystack" className="text-sm font-medium cursor-pointer">Direct Paystack</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="WALLET" id="method-wallet" />
                                                    <Label htmlFor="method-wallet" className="text-sm font-medium cursor-pointer">Pay with Wallet</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-lg font-bold bg-green-700 hover:bg-green-800 shadow-md"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : isWaiverActive ? (
                                <ShieldCheck className="mr-2 h-5 w-5" />
                            ) : programme.paymentRequired && parseFloat(programme.amount || "0") > 0 ? (
                                <CreditCard className="mr-2 h-5 w-5" />
                            ) : (
                                <UserPlus className="mr-2 h-5 w-5" />
                            )}
                            {isWaiverActive ? "Complete Registration (Free)" : 
                             programme.paymentRequired && effectiveNormal > 0 ? `Proceed to Payment (₦${effectiveNormal}${isEarlyBird ? " Early Bird" : ""})` : 
                             "Confirm Registration"}
                        </Button>
                        <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                            TMC Portal © {new Date().getFullYear()} • Secure Registration
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
                    <p className="text-muted-foreground animate-pulse">Initializing...</p>
                </div>
            }>
                <RegistrationContent />
            </Suspense>
        </div>
    )
}
