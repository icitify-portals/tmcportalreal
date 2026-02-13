"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { NationalNode, StateNode, LgaNode, BranchNode } from "@/lib/org-helper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Trash2, Edit, Building2, Plus, UserCog } from "lucide-react"
import { deleteOrganization } from "@/lib/actions/organization"
import { toast } from "sonner"
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { OrganizationForm } from "./organization-form"

interface OrganizationTreeProps {
    data: NationalNode[]
    allOrgs: any[] // Full list for lookup and parent selection
}

export function OrganizationTree({ data, allOrgs }: OrganizationTreeProps) {
    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    // Edit State
    const [editId, setEditId] = useState<string | null>(null)
    const editingOrg = allOrgs.find(o => o.id === editId)

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const confirmDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        const res = await deleteOrganization(deleteId)
        setIsDeleting(false)
        setDeleteId(null)
        if (res.success) {
            toast.success("Organization deleted")
            router.refresh()
        } else {
            toast.error(res.error || "Failed to delete")
        }
    }

    if (!mounted) return null

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No organizations found. Start by adding one.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {data.map(national => (
                <div key={national.id} className="space-y-4">
                    {/* National Node */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5 border-primary/20 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="font-bold text-xl block">{national.name}</span>
                                <Badge variant="default" className="text-[10px] h-4 uppercase">National Headquarters</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild title="Manage & Officials">
                                <Link href={`/dashboard/admin/organizations/${national.id}`}>
                                    <UserCog className="h-4 w-4 text-primary" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditId(national.id)} className="border-primary/20 hover:bg-primary/5 text-primary">
                                <Edit className="h-4 w-4 mr-2" /> Edit National
                            </Button>
                        </div>
                    </div>

                    <div className="pl-6 space-y-4 border-l-2 border-dashed border-muted ml-6">
                        {national.states.map(state => (
                            <Collapsible key={state.id} className="border rounded-lg bg-card text-card-foreground shadow-sm">
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/50 group">
                                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                                <span className="sr-only">Toggle</span>
                                            </Button>
                                        </CollapsibleTrigger>
                                        <span className="font-semibold text-lg">{state.name}</span>
                                        <Badge variant="outline">State</Badge>
                                        <Badge variant="secondary" className="text-xs">{state.lgas.length} LGAs</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" asChild title="Manage & Officials">
                                            <Link href={`/dashboard/admin/organizations/${state.id}`}>
                                                <UserCog className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setEditId(state.id)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(state.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CollapsibleContent className="border-t bg-muted/10">
                                    <div className="p-4 pl-6 pt-4 space-y-3">
                                        {state.lgas.length === 0 && <p className="text-sm text-muted-foreground italic">No LGAs</p>}

                                        {state.lgas.map((lga: LgaNode) => (
                                            <Collapsible key={lga.id} className="border-l-2 border-green-200 pl-4">
                                                <div className="flex items-center justify-between py-2">
                                                    <div className="flex items-center gap-2">
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/50 group">
                                                                <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                                                <span className="sr-only">Toggle</span>
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <span className="font-medium">{lga.name}</span>
                                                        <Badge variant="outline" className="text-xs scale-90">LGA</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Manage">
                                                            <Link href={`/dashboard/admin/organizations/${lga.id}`}>
                                                                <UserCog className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditId(lga.id)}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(lga.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <CollapsibleContent>
                                                    <div className="pl-6 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {lga.branches.map((branch: BranchNode) => (
                                                            <div key={branch.id} className="flex items-center justify-between bg-background p-2 rounded border text-sm group hover:border-primary/50 transition-colors">
                                                                <span className="truncate font-medium text-muted-foreground group-hover:text-foreground" title={branch.name}>{branch.name}</span>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Manage">
                                                                        <Link href={`/dashboard/admin/organizations/${branch.id}`}>
                                                                            <UserCog className="h-3 w-3" />
                                                                        </Link>
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditId(branch.id)}>
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(branch.id)}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {lga.branches.length === 0 && <span className="text-xs text-muted-foreground italic">No branches</span>}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                </div>
            ))}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the organization.
                            Ensure it has no children before deleting.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>Update organization details.</DialogDescription>
                    </DialogHeader>
                    {editingOrg && (
                        <OrganizationForm
                            organizations={allOrgs}
                            initialData={editingOrg}
                            onSuccess={() => setEditId(null)}
                            isModal
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
