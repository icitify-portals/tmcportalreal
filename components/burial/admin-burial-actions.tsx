"use client"

import { Button } from "@/components/ui/button"
import { updateBurialRequestStatus, generateBurialCertificateRef, markBurialRequestAsPaid } from "@/lib/actions/burial"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X, DollarSign, Shovel } from "lucide-react"
import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface AdminBurialActionsProps {
    requestId: string
    status: string
    userId: string // admin id
    currentAmount: number
}


export function AdminBurialActions({ requestId, status, userId, currentAmount }: AdminBurialActionsProps) {

    const router = useRouter()
    const [rejectReason, setRejectReason] = useState("")
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const [isApproveOpen, setIsApproveOpen] = useState(false)
    const [amount, setAmount] = useState(currentAmount.toString())


    async function handleStatusUpdate(newStatus: 'PENDING' | 'APPROVED_UNPAID' | 'PAID' | 'BURIAL_DONE' | 'REJECTED', reason?: string, overrideAmount?: number) {
        const res = await updateBurialRequestStatus(requestId, newStatus, reason, overrideAmount)

        if (res.success) {
            toast.success(`Request marked as ${newStatus}`)
            if (newStatus === 'BURIAL_DONE') {
                // Trigger certificate generation
                await generateBurialCertificateRef(requestId, userId)
                toast.success("Certificate Generated")
            }
            router.refresh()
        } else {
            toast.error("Failed to update status")
        }
    }

    async function handleMarkPaid() {
        const res = await markBurialRequestAsPaid(requestId, "MANUAL_ADMIN_OVERRIDE")
        if (res.success) {
            toast.success("Request marked as PAID")
            router.refresh()
        } else {
            toast.error("Failed to mark as paid")
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {status === 'PENDING' && (
                <>
                    <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>

                        <DialogTrigger asChild>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <Check className="mr-2 h-4 w-4" /> Approve Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Approve Burial Request</DialogTitle>
                                <DialogDescription>Review and set the verification fee for this request.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Verification Fee (₦)</Label>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="10000"
                                    />
                                    <p className="text-xs text-muted-foreground italic">
                                        The user will see this amount and be able to pay it after you approve.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => {
                                    handleStatusUpdate('APPROVED_UNPAID', undefined, parseFloat(amount))
                                    setIsApproveOpen(false)
                                }} className="bg-green-600">Confirm Approval</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>


                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <X className="mr-2 h-4 w-4" /> Reject Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject Burial Request</DialogTitle>
                                <DialogDescription>Please provide a reason for rejection.</DialogDescription>
                            </DialogHeader>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                            />
                            <DialogFooter>
                                <Button onClick={() => {
                                    handleStatusUpdate('REJECTED', rejectReason)
                                    setIsRejectOpen(false)
                                }} variant="destructive">Confirm Rejection</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {status === 'APPROVED_UNPAID' && (
                <Button onClick={handleMarkPaid} className="w-full">
                    <DollarSign className="mr-2 h-4 w-4" /> Mark as Paid (Manual)
                </Button>
            )}

            {status === 'PAID' && (
                <Button onClick={() => handleStatusUpdate('BURIAL_DONE')} className="w-full">
                    <Shovel className="mr-2 h-4 w-4" /> Mark Burial as Done
                </Button>
            )}
        </div>
    )
}
