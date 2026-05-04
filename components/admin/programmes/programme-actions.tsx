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
import { MoreHorizontal, Edit, Trash, Loader2, Users, Calendar, XCircle } from "lucide-react"
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

interface ProgrammeActionsProps {
    programme: any
}

export function ProgrammeActions({ programme }: ProgrammeActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

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
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/programmes/${programme.id}/registrations`}>
                            <Users className="mr-2 h-4 w-4" /> Registrations
                        </Link>
                    </DropdownMenuItem>
                    {programme.status === 'APPROVED' && (
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
                            Please choose a new date or mark the programme as postponed indefinitely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="indefinitely" 
                                checked={postponedIndefinitely}
                                onCheckedChange={(checked) => setPostponedIndefinitely(checked === true)}
                            />
                            <label htmlFor="indefinitely" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Postpone Indefinitely
                            </label>
                        </div>

                        {!postponedIndefinitely && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Date</label>
                                <Input 
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPostponeOpen(false)} disabled={isPostponing}>
                            Cancel
                        </Button>
                        <Button onClick={handlePostpone} disabled={isPostponing} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {isPostponing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Postpone"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the programme
                            "{programme.title}" and remove it from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
