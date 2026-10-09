"use client"

import { useEffect, useState, useTransition } from "react"
import { getNoteVersions, restoreNoteVersion } from "@/lib/actions/meeting-notes"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, History, RotateCcw } from "lucide-react"
import { toast } from "sonner"

type VersionRow = {
    id: string
    noteId: string
    version: number
    createdBy: string | null
    createdAt: Date | string | null
    html?: string | null
}

export function VersionHistoryDialog({
    noteId,
    open,
    onOpenChange,
    onRestored,
}: {
    noteId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRestored: (html: string, plainText: string) => void
}) {
    const [versions, setVersions] = useState<VersionRow[] | null>(null)
    const [restoring, setRestoring] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!open || !noteId) return
        getNoteVersions(noteId)
            .then(setVersions)
            .catch(() => toast.error("Failed to load version history"))
    }, [open, noteId])

    function handleRestore(version: number) {
        if (!noteId) return
        if (!confirm(`Restore this note to version ${version}? The current version will be kept as history.`)) return
        setRestoring(String(version))
        startTransition(async () => {
            const res = await restoreNoteVersion(noteId, version)
            setRestoring(null)
            if (res.success) {
                toast.success(`Version ${version} restored`)
                onRestored(res.html || "", res.plainText || "")
            } else {
                toast.error(res.error || "Failed to restore version")
            }
        })
    }

    const snippet = (html?: string | null) =>
        (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) || "(empty page)"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" /> Version history
                    </DialogTitle>
                    <DialogDescription>
                        Every auto-save is kept as a snapshot. Restoring keeps the current version as history too.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 rounded-md border p-2">
                    {versions === null ? (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                        </div>
                    ) : versions.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            No previous versions yet. Each edit is snapshotted automatically.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {versions.map((v) => (
                                <li key={v.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">v{v.version}</Badge>
<span className="text-xs text-muted-foreground">
                                        {v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"}
                                    </span>
                                        </div>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">{snippet(v.html)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isPending || restoring === String(v.version)}
                                        onClick={() => handleRestore(v.version)}
                                    >
                                        {restoring === String(v.version) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                        Restore
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}