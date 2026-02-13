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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateRequestStatus } from "@/lib/actions/occasions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface RequestActionDialogProps {
    request: any
    mode: 'APPROVE' | 'COMPLETE' | 'REJECT'
    triggerText?: string
}

export function RequestActionDialog({ request, mode, triggerText }: RequestActionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [certificateNo, setCertificateNo] = useState("")

    async function onConfirm() {
        setIsPending(true)
        try {
            let status: 'APPROVED' | 'COMPLETED' | 'REJECTED' = 'APPROVED'
            if (mode === 'COMPLETE') status = 'COMPLETED'
            if (mode === 'REJECT') status = 'REJECTED'

            const res = await updateRequestStatus(request.id, status, certificateNo || undefined)

            if (res.success) {
                toast.success(`Request ${status.toLowerCase()}`)
                setOpen(false)
            } else {
                toast.error(res.error || "Failed")
            }
        } catch (error) {
            toast.error("Error updating request")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={mode === 'REJECT' ? 'destructive' : mode === 'COMPLETE' ? 'default' : 'secondary'}
                    size="sm"
                >
                    {triggerText || mode}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode} Request</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to {mode.toLowerCase()} this request from {request.user?.name}?
                    </DialogDescription>
                </DialogHeader>

                {mode === 'COMPLETE' && request.certificateNeeded && (
                    <div className="space-y-2">
                        <Label>Certificate Number</Label>
                        <Input
                            placeholder="Enter Certificate No."
                            value={certificateNo}
                            onChange={(e) => setCertificateNo(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Required to generate user certificate.</p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant={mode === 'REJECT' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm {mode}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
