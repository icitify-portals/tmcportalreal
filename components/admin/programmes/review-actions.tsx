"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { approveProgrammeState, approveProgrammeNational, rejectProgramme } from "@/lib/actions/programmes"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ReviewActionsProps {
    programmeId: string
    status: string
}

export function ReviewActions({ programmeId, status }: ReviewActionsProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [open, setOpen] = useState(false)

    async function handleApprove() {
        setIsApproving(true)
        try {
            let res
            if (status === 'PENDING_STATE') res = await approveProgrammeState(programmeId)
            if (status === 'PENDING_NATIONAL') res = await approveProgrammeNational(programmeId)
            
            if (res?.success) {
                toast.success("Programme approved")
            } else {
                toast.error(res?.error || "Approval failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsApproving(false)
        }
    }

    async function handleReject() {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection")
            return
        }

        setIsRejecting(true)
        try {
            const res = await rejectProgramme(programmeId, rejectionReason)
            if (res.success) {
                toast.success("Programme rejected")
                setOpen(false)
            } else {
                toast.error(res.error || "Rejection failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsRejecting(false)
        }
    }

    return (
        <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
            >
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Programme</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this programme. This will be visible to the submitting officer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Reason for rejection..." 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isRejecting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
