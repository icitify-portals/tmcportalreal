"use client"

import { useState } from "react"
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
import { registerForProgramme } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

export function RegisterForProgrammeDialog({
    programmeId,
    programmeTitle,
    amount
}: {
    programmeId: string,
    programmeTitle: string,
    amount: number
}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleRegister() {
        setIsSubmitting(true)
        try {
            const result = await registerForProgramme(programmeId)

            if (result.success) {
                toast.success("Successfully registered for programme")
                setOpen(false)
            } else {
                toast.error(result.error || "Failed to register")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register {amount > 0 ? `(₦${amount})` : "Free"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register for {programmeTitle}</DialogTitle>
                    <DialogDescription>
                        Confirm your registration for this event.
                        {amount > 0 && " You will be redirected to payment (Simulated)."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        By registering, you agree to attend the programme at the scheduled time and venue.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleRegister} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Registration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
