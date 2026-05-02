"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { registerForProgramme, initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { Loader2, UserPlus, CreditCard, MapPin, Globe } from "lucide-react"
import { nigerianStatesAndLgas } from "@/lib/nigeria-data"
import { countries } from "@/lib/countries"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function RegisterForProgrammeDialog({
    programmeId,
    programmeTitle,
    amount,
    allowInstallments,
    minInstallmentAmount,
    triggerText,
    variant
}: {
    programmeId: string,
    programmeTitle: string,
    amount: number,
    allowInstallments?: boolean,
    minInstallmentAmount?: number,
    triggerText?: string,
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}) {
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customAmount, setCustomAmount] = useState<string>(amount.toString())
    
    // Guest form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        gender: "MALE",
        address: "",
        country: "Nigeria",
        state: "",
        lga: ""
    })

    const selectedStateData = nigerianStatesAndLgas.find(s => s.state === formData.state)

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // If logged in, we don't need formData (action handles it from session)
            // If guest, we pass formData
            const result = await registerForProgramme(programmeId, session ? undefined : formData)

            if (result.success) {
                if (result.paymentRequired) {
                    toast.info("Registration saved. Redirecting to payment...")
                    const payAmount = parseFloat(customAmount || "0")
                    const payResult = await initializeProgrammeRegistrationPayment(result.registrationId!, payAmount)
                    if (payResult.success && payResult.authorizationUrl) {
                        window.location.href = payResult.authorizationUrl
                    } else {
                        toast.error(payResult.error || "Failed to initialize payment")
                    }
                } else {
                    toast.success("Successfully registered for programme")
                    setOpen(false)
                }
            } else if (result.registrationId) {
                toast.info("You are already registered. Opening your access slip...")
                setOpen(false)
                window.open(`/programmes/registrations/${result.registrationId}/slip`, '_blank')
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant || "default"} className={variant !== "outline" ? "w-full bg-green-700 hover:bg-green-800" : "w-full"}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {triggerText || `Register ${amount > 0 ? `(₦${amount})` : "Free"}`}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleRegister}>
                    <DialogHeader>
                        <DialogTitle>Register for {programmeTitle}</DialogTitle>
                        <DialogDescription>
                            {session 
                                ? `You are registering as ${session.user.name}.`
                                : "Please provide your details to register for this event."}
                        </DialogDescription>
                    </DialogHeader>

                    {amount > 0 && allowInstallments && (
                        <div className="border p-3 rounded-md bg-green-50/50 my-2 space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-green-800 block">Payment Options</Label>
                            <RadioGroup 
                                defaultValue="FULL" 
                                onValueChange={(v) => {
                                    if (v === "FULL") {
                                        setCustomAmount(amount.toString())
                                    } else {
                                        setCustomAmount(minInstallmentAmount ? minInstallmentAmount.toString() : amount.toString())
                                    }
                                }}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="FULL" id="full-pay" />
                                    <Label htmlFor="full-pay" className="text-sm font-medium">Full Amount (₦{amount})</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PARTIAL" id="partial-pay" />
                                    <Label htmlFor="partial-pay" className="text-sm font-medium">Pay in Installment</Label>
                                </div>
                            </RadioGroup>

                            {customAmount !== amount.toString() && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="inst-amount" className="text-xs font-bold uppercase text-green-700">Installment Amount (₦)</Label>
                                    <Input 
                                        id="inst-amount"
                                        type="number" 
                                        min={minInstallmentAmount || 0}
                                        max={amount} 
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="bg-white"
                                    />
                                    {minInstallmentAmount && (
                                        <p className="text-[10px] text-green-600">Minimum installment allowed: ₦{minInstallmentAmount}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="py-2">
                        {session && (
                            <p className="text-sm text-gray-600 mb-4">
                                Your membership details will be automatically linked to this registration.
                            </p>
                        )}
                    </div>

                    {!session && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-xs font-bold uppercase text-gray-500">Name</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="col-span-3" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right text-xs font-bold uppercase text-gray-500">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email"
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="col-span-3" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right text-xs font-bold uppercase text-gray-500">Phone</Label>
                                <Input 
                                    id="phone" 
                                    value={formData.phone} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="col-span-3" 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs font-bold uppercase text-gray-500">Gender</Label>
                                <RadioGroup 
                                    defaultValue="MALE" 
                                    className="flex gap-4 col-span-3"
                                    onValueChange={(v) => setFormData({...formData, gender: v})}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="MALE" id="male" />
                                        <Label htmlFor="male">Male</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="FEMALE" id="female" />
                                        <Label htmlFor="female">Female</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right text-xs font-bold uppercase text-gray-500">Address</Label>
                                <Textarea 
                                    id="address" 
                                    value={formData.address} 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="col-span-3" 
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs font-bold uppercase text-gray-500">Country</Label>
                                <Select 
                                    value={formData.country} 
                                    onValueChange={(v) => setFormData({...formData, country: v, state: "", lga: ""})}
                                >
                                    <SelectTrigger className="col-span-3">
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
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-xs font-bold uppercase text-gray-500">State</Label>
                                        <Select 
                                            value={formData.state} 
                                            onValueChange={(v) => setFormData({...formData, state: v, lga: ""})}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {nigerianStatesAndLgas.map(s => (
                                                    <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-xs font-bold uppercase text-gray-500">LGA</Label>
                                        <Select 
                                            value={formData.lga} 
                                            onValueChange={(v) => setFormData({...formData, lga: v})}
                                            disabled={!formData.state}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select LGA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedStateData?.lgas.map(lga => (
                                                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="state" className="text-right text-xs font-bold uppercase text-gray-500">State/Province</Label>
                                        <Input 
                                            id="state" 
                                            value={formData.state} 
                                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                                            className="col-span-3" 
                                            placeholder="Enter State/Province"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="lga" className="text-right text-xs font-bold uppercase text-gray-500">City/Local Govt</Label>
                                        <Input 
                                            id="lga" 
                                            value={formData.lga} 
                                            onChange={(e) => setFormData({...formData, lga: e.target.value})}
                                            className="col-span-3" 
                                            placeholder="Enter City/Local Govt"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {session && (
                        <div className="py-6">
                            <p className="text-sm text-gray-600">
                                Your membership details will be automatically linked to this registration.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-green-700 hover:bg-green-800">
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : amount > 0 ? (
                                <CreditCard className="mr-2 h-4 w-4" />
                            ) : (
                                <UserPlus className="mr-2 h-4 w-4" />
                            )}
                            {amount > 0 ? "Proceed to Payment" : "Confirm Registration"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
