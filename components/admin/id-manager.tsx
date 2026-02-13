"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, RefreshCw } from "lucide-react"

interface IdManagerProps {
    memberId: string
    currentId: string | null | undefined
}

export function IdManager({ memberId, currentId }: IdManagerProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [newId, setNewId] = useState(currentId || "")
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdate = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/members/${memberId}/manage-id`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: newId }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update ID")
            }

            toast.success("Membership ID updated")
            setIsOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to remove the Membership ID? This will revert the member to non-ID status.")) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/members/${memberId}/manage-id`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to delete ID")
            }

            toast.success("Membership ID removed")
            setNewId("") // Clear local state
            setIsOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Edit ID</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Membership ID</DialogTitle>
                    <DialogDescription>
                        Manually update or remove the membership ID. Ensure the new ID follows the format TMC/CC/SS/####.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Input
                            value={newId}
                            onChange={(e) => setNewId(e.target.value)}
                            placeholder="TMC/01/01/0001"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        type="button"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove ID
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isLoading}
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
