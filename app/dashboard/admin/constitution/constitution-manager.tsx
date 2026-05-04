"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { FileText, Plus, Edit, Trash, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
    createConstitutionDraft,
    updateConstitutionDraft,
    approveConstitutionDraft,
    deleteConstitutionDraft,
} from "@/lib/actions/constitution"

import { FileUpload } from "@/components/ui/file-upload"

interface ConstitutionManagerProps {
    drafts: any[]
}

export function ConstitutionManager({ drafts }: ConstitutionManagerProps) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [documentUrl, setDocumentUrl] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Viewing / Editing draft state
    const [selectedDraft, setSelectedDraft] = useState<any>(null)
    const [editMode, setEditMode] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editContent, setEditContent] = useState("")
    const [editDocumentUrl, setEditDocumentUrl] = useState("")

    // Delete alert state
    const [deleteId, setDeleteId] = useState<string | null>(null)

    async function handleCreateDraft() {
        if (!title.trim() || (!content.trim() && !documentUrl.trim())) {
            toast.error("Please enter a title, content, or upload a document.")
            return
        }
        setIsSaving(true)
        try {
            const finalContent = content.trim() || "Document uploaded for review. Click Download to view original."
            const res = await createConstitutionDraft(title, finalContent, documentUrl)
            if (res.success) {
                toast.success("Draft saved successfully.")
                setCreateOpen(false)
                setTitle("")
                setContent("")
                setDocumentUrl("")
            } else {
                toast.error(res.error || "Failed to save draft.")
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred.")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleUpdateDraft() {
        if (!editTitle.trim() || (!editContent.trim() && !editDocumentUrl.trim())) {
            toast.error("Please enter a title and content/document.")
            return
        }
        setIsSaving(true)
        try {
            const finalContent = editContent.trim() || "Document uploaded for review. Click Download to view original."
            const res = await updateConstitutionDraft(selectedDraft.id, editTitle, finalContent, editDocumentUrl)
            if (res.success) {
                toast.success("Draft updated successfully.")
                setEditMode(false)
                setSelectedDraft({
                    ...selectedDraft,
                    title: editTitle,
                    content: finalContent,
                    documentUrl: editDocumentUrl,
                })
            } else {
                toast.error(res.error || "Failed to update draft.")
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred.")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleApproveDraft(id: string) {
        try {
            const res = await approveConstitutionDraft(id)
            if (res.success) {
                toast.success("Constitution approved and published successfully.")
                setSelectedDraft(null)
            } else {
                toast.error(res.error || "Failed to approve draft.")
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred.")
        }
    }

    async function handleDeleteDraft() {
        if (!deleteId) return
        try {
            const res = await deleteConstitutionDraft(deleteId)
            if (res.success) {
                toast.success("Draft deleted successfully.")
                if (selectedDraft?.id === deleteId) {
                    setSelectedDraft(null)
                    setEditMode(false)
                }
                setDeleteId(null)
            } else {
                toast.error(res.error || "Failed to delete draft.")
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred.")
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Drafts List</h3>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white flex gap-1">
                                <Plus className="h-4 w-4" /> Create Draft
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-gray-900">New Constitution Draft</DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium">Create a draft to collaborate with the committee.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Title</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Constitutional Review Draft 2026"
                                        className="border border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Content</label>
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Draft text or JSON sections format..."
                                        rows={12}
                                        className="border border-gray-200 font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Word Document (Optional)</label>
                                    <FileUpload
                                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onUploadComplete={(url) => setDocumentUrl(url)}
                                        label={documentUrl ? "Replace File" : "Upload Document"}
                                    />
                                    {documentUrl && (
                                        <p className="text-xs text-green-600 font-medium truncate">File: {documentUrl}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleCreateDraft} disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white">
                                    {isSaving ? "Saving..." : "Save Draft"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-3">
                    {drafts.length === 0 ? (
                        <Card className="border border-dashed border-gray-200 bg-gray-50/50">
                            <CardContent className="p-6 text-center text-gray-500 font-medium">
                                No drafts found. Create your first draft to start reviewing.
                            </CardContent>
                        </Card>
                    ) : (
                        drafts.map((d) => (
                            <Card
                                key={d.id}
                                onClick={() => {
                                    setSelectedDraft(d)
                                    setEditMode(false)
                                    setEditTitle(d.title)
                                    setEditContent(d.content)
                                    setEditDocumentUrl(d.documentUrl || "")
                                }}
                                className={`cursor-pointer transition-all border shadow-sm ${
                                    selectedDraft?.id === d.id
                                        ? "border-green-600 bg-green-50/40"
                                        : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                                }`}
                            >
                                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                                            {d.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-gray-500">
                                            {new Date(d.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            d.status === "APPROVED"
                                                ? "default"
                                                : d.status === "ARCHIVED"
                                                ? "secondary"
                                                : "outline"
                                        }
                                        className={
                                            d.status === "APPROVED"
                                                ? "bg-green-600 hover:bg-green-600 font-bold"
                                                : d.status === "ARCHIVED"
                                                ? "bg-gray-300 font-bold text-gray-800"
                                                : "border-yellow-200 text-yellow-800 bg-yellow-50 font-bold"
                                        }
                                    >
                                        {d.status}
                                    </Badge>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <div className="md:col-span-2">
                {selectedDraft ? (
                    <Card className="border border-gray-200 bg-white shadow-sm h-full">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <div className="space-y-1">
                                {editMode ? (
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-xl font-bold border border-gray-200"
                                    />
                                ) : (
                                    <CardTitle className="text-2xl font-bold text-gray-900">{selectedDraft.title}</CardTitle>
                                )}
                                <CardDescription className="text-xs text-gray-500">
                                    Status: <span className="font-bold">{selectedDraft.status}</span>
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                {editMode ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditMode(false)}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleUpdateDraft}
                                            disabled={isSaving}
                                            className="bg-green-700 hover:bg-green-800 text-white"
                                        >
                                            {isSaving ? "Saving..." : "Save"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditMode(true)}
                                            className="border-gray-200 text-gray-700"
                                        >
                                            <Edit className="h-4 w-4 mr-1 text-gray-600" /> Edit
                                        </Button>
                                        {selectedDraft.status !== "APPROVED" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleApproveDraft(selectedDraft.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & Publish
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDeleteId(selectedDraft.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {editMode ? (
                                <div className="space-y-3">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={20}
                                        className="w-full border border-gray-200 font-mono text-sm leading-relaxed"
                                    />
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Word Document (Optional)</label>
                                        <FileUpload
                                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onUploadComplete={(url) => setEditDocumentUrl(url)}
                                            label={editDocumentUrl ? "Replace File" : "Upload Document"}
                                        />
                                        {editDocumentUrl && (
                                            <p className="text-xs text-green-600 font-medium truncate">File: {editDocumentUrl}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="whitespace-pre-line text-green-900 leading-relaxed font-medium bg-green-50/40 p-4 rounded-xl border border-green-100/60 max-h-[60vh] overflow-y-auto">
                                        {selectedDraft.content}
                                    </div>
                                    {selectedDraft.documentUrl && (
                                        <div className="flex justify-end pt-2">
                                            <a
                                                href={selectedDraft.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                            >
                                                📥 Download / Review Original Document
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border border-dashed border-gray-200 bg-gray-50/50 h-[300px] flex items-center justify-center">
                        <div className="text-center space-y-2 text-gray-500 font-medium">
                            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto" />
                            <p>No draft selected. Select a draft from the list to view or edit it.</p>
                        </div>
                    </Card>
                )}
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            This action cannot be undone. This will permanently delete the selected draft.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDraft} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
