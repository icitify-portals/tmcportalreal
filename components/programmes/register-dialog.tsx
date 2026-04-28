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
import { Loader2, UserPlus, CreditCard } from "lucide-react"

export function RegisterForProgrammeDialog({
    programmeId,
    programmeTitle,
    amount
}: {
    programmeId: string,
    programmeTitle: string,
    amount: number
}) {
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Guest form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        gender: "MALE",
        address: ""
    })

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
                    const payResult = await initializeProgrammeRegistrationPayment(result.registrationId!)
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
                // Already registered case
                toast.error(result.error)
                // Optionally redirect to the slip or show a link
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
                <Button className="w-full bg-green-700 hover:bg-green-800">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register {amount > 0 ? `(₦${amount})` : "Free"}
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
