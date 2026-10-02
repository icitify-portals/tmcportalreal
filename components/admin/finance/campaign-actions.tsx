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
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteCampaign, updateCampaign } from "@/lib/actions/campaigns"
import { useRouter } from "next/navigation"

interface Campaign {
    id: string
    title: string
    description: string | null
    targetAmount: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    raisedAmount: string | null
    slug: string
}

interface CampaignActionsProps {
    campaign: Campaign
}

export function CampaignActions({ campaign }: CampaignActionsProps) {
    const router = useRouter()
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const raisedAmount = parseFloat(campaign.raisedAmount || "0")
    const hasDonations = raisedAmount > 0

    // Edit form state
    const [title, setTitle] = useState(campaign.title)
    const [description, setDescription] = useState(campaign.description || "")
    const [targetAmount, setTargetAmount] = useState(
        parseFloat(campaign.targetAmount || "0").toString()
    )
    const [status, setStatus] = useState(campaign.status || "ACTIVE")

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteCampaign(campaign.id)
            if (result.success) {
                toast.success("Campaign deleted successfully")
                setDeleteOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Failed to delete campaign")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleUpdate = async () => {
        if (!title.trim()) {
            toast.error("Title is required")
            return
        }
        if (!targetAmount || parseFloat(targetAmount) < 100) {
            toast.error("Target amount must be at least ₦100")
            return
        }
        setIsUpdating(true)
        try {
            const result = await updateCampaign(campaign.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                targetAmount: parseFloat(targetAmount),
                status: status as "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED",
            })
            if (result.success) {
                toast.success("Campaign updated successfully")
                setEditOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Failed to update campaign")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                {/* Edit Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setEditOpen(true)}
                    title="Edit campaign"
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                    title="Delete campaign"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Are you sure you want to delete <strong>&quot;{campaign.title}&quot;</strong>? This action
                                    cannot be undone.
                                </p>
                                {hasDonations && (
                                    <p className="text-amber-600 font-medium">
                                        ⚠️ This campaign has received ₦{raisedAmount.toLocaleString()} in donations.
                                        The donation records will be preserved but unlinked from this campaign.
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Yes, Delete Campaign"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Campaign</DialogTitle>
                        <DialogDescription>
                            Update the details for &quot;{campaign.title}&quot;.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Campaign Title</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Ramadan Welfare 2025"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the cause..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-target">Target Amount (₦)</Label>
                            <Input
                                id="edit-target"
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="1000000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="PAUSED">Paused</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
