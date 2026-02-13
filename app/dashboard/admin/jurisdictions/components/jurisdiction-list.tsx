"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteJurisdiction } from "../actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Jurisdiction {
    id: string
    name: string
    code: string
    level: string
    parent?: {
        name: string
        code: string
    } | null
}

interface JurisdictionListProps {
    data: Jurisdiction[]
    level: "STATE" | "LOCAL_GOVERNMENT" | "BRANCH"
}

export function JurisdictionList({ data, level }: JurisdictionListProps) {

    async function handleDelete(id: string) {
        try {
            const res = await deleteJurisdiction(id)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Failed to delete jurisdiction")
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        {(level === "LOCAL_GOVERNMENT" || level === "BRANCH") && (
                            <TableHead>{level === "LOCAL_GOVERNMENT" ? "State" : "LGA"}</TableHead>
                        )}
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No jurisdictions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.code}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                {(level === "LOCAL_GOVERNMENT" || level === "BRANCH") && (
                                    <TableCell>
                                        {item.parent ? (
                                            <div className="flex flex-col">
                                                <span>{item.parent.name}</span>
                                                <span className="text-xs text-muted-foreground">{item.parent.code}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">None</span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the
                                                    jurisdiction <strong>{item.name}</strong>.
                                                    {level !== "BRANCH" && (
                                                        <div className="mt-2 text-red-500 font-medium">
                                                            Ensure there are no sub-jurisdictions connected to this item, otherwise deletion will fail.
                                                        </div>
                                                    )}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
