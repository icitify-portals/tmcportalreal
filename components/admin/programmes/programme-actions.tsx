"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash, Loader2, Users, Calendar, XCircle, Share2 } from "lucide-react"
import { EditProgrammeDialog } from "./edit-programme-dialog"
import { deleteProgramme, postponeProgramme, cancelProgramme } from "@/lib/actions/programmes"
import { toast } from "sonner"
import Link from "next/link"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ShareProgrammeDialog } from "@/components/programmes/share-programme-dialog"

interface ProgrammeActionsProps {
    programme: any
    canEdit?: boolean
}

export function ProgrammeActions({ programme, canEdit = true }: ProgrammeActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)

    // Postpone state
    const [postponeOpen, setPostponeOpen] = useState(false)
    const [newDate, setNewDate] = useState("")
    const [postponedIndefinitely, setPostponedIndefinitely] = useState(false)
    const [isPostponing, setIsPostponing] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const res = await deleteProgramme(programme.id)
            if (res.success) {
                toast.success("Programme deleted")
            } else {
                toast.error(res.error || "Failed to delete")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsDeleting(false)
            setDeleteOpen(false)
        }
    }

    async function handlePostpone() {
        if (!postponedIndefinitely && !newDate) {
            toast.error("Please enter a new date or choose to postpone indefinitely")
            return
        }
        setIsPostponing(true)
        try {
            const res = await postponeProgramme(programme.id, postponedIndefinitely ? undefined : newDate)
            if (res.success) {
                toast.success("Programme postponed")
                setPostponeOpen(false)
            } else {
                toast.error(res.error || "Failed to postpone")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsPostponing(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-white hover:text-white bg-green-950/70 hover:bg-green-800/90 border border-green-700/60 rounded-md transition-all shadow-xs flex items-center justify-center cursor-pointer"
                        title="Manage Programme Actions"
                    >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-emerald-200 hover:text-white" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => setShareOpen(true)}>
                        <Share2 className="mr-2 h-4 w-4 text-emerald-600" /> Share Link
                    </DropdownMenuItem>
                    
                    {canEdit && (
                        <DropdownMenuItem onClick={() => setEditOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/programmes/${programme.id}/registrations`}>
                            <Users className="mr-2 h-4 w-4" /> Registrations
                        </Link>
                    </DropdownMenuItem>
                    
                    {canEdit && programme.status === 'APPROVED' && (
                        <>
                            <DropdownMenuItem onClick={() => setPostponeOpen(true)}>
                                <Calendar className="mr-2 h-4 w-4 text-orange-600" /> Postpone
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                                const res = await cancelProgramme(programme.id)
                                if (res.success) toast.success("Programme cancelled")
                                else toast.error(res.error || "Action failed")
                            }}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancel
                            </DropdownMenuItem>
                        </>
                    )}
                    
                    {canEdit && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {shareOpen && (
                <ShareProgrammeDialog
                    programme={programme}
                    open={shareOpen}
                    onOpenChange={setShareOpen}
                    trigger={<span className="hidden" />}
                />
            )}

            {editOpen && (
                <EditProgrammeDialog
                    programme={programme}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                />
            )}

            {/* Postpone Modal */}
            <Dialog open={postponeOpen} onOpenChange={setPostponeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Postpone Programme</DialogTitle>
                        <DialogDescription>
                            Change the date for this programme or postpone it indefinitely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="indefinite" 
                                checked={postponedIndefinitely} 
                                onCheckedChange={(checked) => setPostponedIndefinitely(!!checked)} 
                            />
                            <label htmlFor="indefinite" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Postpone indefinitely (Date TBD)
                            </label>
                        </div>
                        
                        {!postponedIndefinitely && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Start Date</label>
                                <Input 
                                    type="date" 
                                    value={newDate} 
                                    onChange={(e) => setNewDate(e.target.value)} 
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPostponeOpen(false)}>Cancel</Button>
                        <Button onClick={handlePostpone} disabled={isPostponing} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {isPostponing ? "Saving..." : "Save Postponement"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this programme and all associated records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
