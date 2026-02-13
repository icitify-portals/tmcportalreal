"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, X, ThumbsUp, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalActionsProps {
    memberId: string
    currentStatus: string
    userRole: string // Simplified for now
}

export function ApprovalActions({ memberId, currentStatus, userRole }: ApprovalActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const [rejectionReason, setRejectionReason] = useState("")
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

    const handleAction = async (action: "RECOMMEND" | "APPROVE" | "REJECT") => {
        if (action === "REJECT" && !isRejectDialogOpen) {
            setIsRejectDialogOpen(true)
            return
        }

        // Logic check: if rejecting, we need a reason
        if (action === "REJECT" && !rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection")
            return
        }

        setIsLoading(true)
        try {
            const body: any = { action }
            if (action === "REJECT") body.reason = rejectionReason

            console.log(`[ApprovalActions] Sending ${action} request for ${memberId}`)

            const response = await fetch(`/api/members/${memberId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Action failed")
            }

            toast.success(data.message || `Action ${action} successful`)

            if (action === "REJECT") {
                setIsRejectDialogOpen(false)
                setRejectionReason("")
            }

            // Force a router refresh to update server components
            router.refresh()

            // Optional: fallback reload if router.refresh() is too slow or cached
            // window.location.reload() 

        } catch (error: any) {
            console.error("Action error:", error)
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (currentStatus === "ACTIVE") {
        return <div className="text-sm font-medium text-green-600 border p-2 rounded text-center">Membership Active</div>
    }

    return (
        <div className="space-y-2">
            {/* Show Recommend button if Pending (and user is lower admin - logic simplified) */}
            {currentStatus === "PENDING" && (
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction("RECOMMEND")}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
                    Recommend Application
                </Button>
            )}

            {/* Show Approve/Reject if Recommended (or logic for SuperAdmin) */}
            {/* Allowing Approve from PENDING too if SuperAdmin override is desired, but strictly following flow: */}
            {(currentStatus === "RECOMMENDED" || currentStatus === "PENDING") && (
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction("APPROVE")}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Approve
                    </Button>

                    <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full"
                                variant="destructive"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                Reject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject Application</DialogTitle>
                                <DialogDescription>
                                    Please provide a detailed reason for rejecting this application. This will be sent to the user.
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
                                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction("REJECT")}
                                    disabled={!rejectionReason.trim() || isLoading}
                                >
                                    Confirm Rejection
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}
