"use client"

import { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Sparkles, FilePlus2, AlignLeft } from "lucide-react"

export function AiSummaryDialog({
    open,
    onOpenChange,
    busy,
    previewHtml,
    error,
    sourceTitle,
    section,
    onInsert,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    busy: boolean
    previewHtml: string | null
    error: string | null
    sourceTitle: string
    section: string
    onInsert: (html: string) => void
    onSave: (title: string, section: string, html: string) => void
}) {
    const [title, setTitle] = useState(`AI Summary — ${sourceTitle}`)
    const [isPending, startTransition] = useTransition()

    function insertIntoPage() {
        if (!previewHtml) return
        onInsert(previewHtml)
        onOpenChange(false)
    }

    function saveAsNewPage() {
        if (!previewHtml) return
        const cleanTitle = title.trim() || `AI Summary — ${sourceTitle}`
        startTransition(() => onSave(cleanTitle, section, previewHtml))
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" /> AI summary
                    </DialogTitle>
                    <DialogDescription>
                        Preview the generated summary, then insert it or keep it as a new page. You can always edit the result.
                    </DialogDescription>
                </DialogHeader>

                {busy ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">Generating summary…</p>
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-center">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                ) : previewHtml ? (
                    <>
                        <ScrollArea className="h-72 rounded-md border bg-white p-4">
                            <div
                                className="prose prose-slate prose-headings:text-black prose-p:text-gray-900 max-w-none text-sm"
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        </ScrollArea>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-medium" placeholder="New page title" />
                            <Button variant="outline" onClick={insertIntoPage} disabled={isPending}>
                                <AlignLeft className="h-4 w-4 mr-1" /> Insert into page
                            </Button>
                            <Button onClick={saveAsNewPage} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FilePlus2 className="h-4 w-4 mr-1" />}
                                Save as new page
                            </Button>
                        </div>
                    </>
                ) : null}

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}