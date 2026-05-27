"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Plus, Edit, Trash, CheckCircle2, AlertCircle, Users, MessageSquare, Search, X, Send } from "lucide-react"
import { toast } from "sonner"
import {
    createConstitutionDraft, updateConstitutionDraft, approveConstitutionDraft,
    deleteConstitutionDraft, assignConstitutionReviewer, removeConstitutionReviewer,
    getConstitutionReviewers, submitConstitutionFeedback, getConstitutionFeedback, advanceConstitutionStage
} from "@/lib/actions/constitution"
import { searchUsers } from "@/lib/actions/users"
import { FileUpload } from "@/components/ui/file-upload"

interface ConstitutionManagerProps { drafts: any[] }

export function ConstitutionManager({ drafts }: ConstitutionManagerProps) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [documentUrl, setDocumentUrl] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isAdvancing, setIsAdvancing] = useState(false)
    const [selectedDraft, setSelectedDraft] = useState<any>(null)
    const [editMode, setEditMode] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editContent, setEditContent] = useState("")
    const [editDocumentUrl, setEditDocumentUrl] = useState("")
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [workshopDialogOpen, setWorkshopDialogOpen] = useState(false)
    const [pendingWorkshopStatus, setPendingWorkshopStatus] = useState("")
    const [workshopDate, setWorkshopDate] = useState("")

    // Reviewers & Feedback
    const [activeTab, setActiveTab] = useState<"content" | "reviewers" | "feedback">("content")
    const [reviewers, setReviewers] = useState<any[]>([])
    const [feedbackList, setFeedbackList] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [feedbackText, setFeedbackText] = useState("")
    const [isSendingFeedback, setIsSendingFeedback] = useState(false)

    useEffect(() => {
        if (selectedDraft?.id) {
            loadReviewers(selectedDraft.id)
            loadFeedback(selectedDraft.id)
        }
    }, [selectedDraft?.id])

    async function loadReviewers(id: string) {
        const r = await getConstitutionReviewers(id)
        setReviewers(r)
    }
    async function loadFeedback(id: string) {
        const f = await getConstitutionFeedback(id)
        setFeedbackList(f)
    }

    async function handleCreateDraft() {
        if (!title.trim() || (!content.trim() && !documentUrl.trim())) {
            toast.error("Please enter a title, content, or upload a document."); return
        }
        setIsSaving(true)
        try {
            const finalContent = content.trim() || "Document uploaded for review. Click Download to view original."
            const res = await createConstitutionDraft(title, finalContent, documentUrl)
            if (res.success) { toast.success("Draft saved."); setCreateOpen(false); setTitle(""); setContent(""); setDocumentUrl("") }
            else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
    }

    async function handleUpdateDraft() {
        if (!editTitle.trim() || (!editContent.trim() && !editDocumentUrl.trim())) {
            toast.error("Please enter a title and content/document."); return
        }
        setIsSaving(true)
        try {
            const finalContent = editContent.trim() || "Document uploaded for review. Click Download to view original."
            const res = await updateConstitutionDraft(selectedDraft.id, editTitle, finalContent, editDocumentUrl)
            if (res.success) {
                toast.success("Draft updated.")
                setEditMode(false)
                setSelectedDraft({ ...selectedDraft, title: editTitle, content: finalContent, documentUrl: editDocumentUrl })
            } else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
    }

    async function handleApproveDraft(id: string) {
        try {
            const res = await approveConstitutionDraft(id)
            if (res.success) { toast.success("Constitution approved."); setSelectedDraft({ ...selectedDraft, status: "APPROVED" }) }
            else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) }
    }

    async function handleAdvanceStage(id: string, newStatus: string, date?: string) {
        setIsAdvancing(true)
        try {
            const res = await advanceConstitutionStage(id, newStatus, date)
            if (res.success) { 
                toast.success(`Advanced to ${newStatus.replace("REVIEW_", "")} Review`)
                setSelectedDraft({ ...selectedDraft, status: newStatus })
                setWorkshopDialogOpen(false)
            }
            else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) } finally { setIsAdvancing(false) }
    }

    async function handleDeleteDraft() {
        if (!deleteId) return
        try {
            const res = await deleteConstitutionDraft(deleteId)
            if (res.success) { toast.success("Deleted."); if (selectedDraft?.id === deleteId) { setSelectedDraft(null); setEditMode(false) }; setDeleteId(null) }
            else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) }
    }

    async function handleSearchUsers(q: string) {
        setSearchQuery(q)
        if (q.length < 2) { setSearchResults([]); return }
        setIsSearching(true)
        try {
            const results = await searchUsers(q)
            const filtered = results.filter((u: any) => !reviewers.some(r => r.userId === u.id))
            setSearchResults(filtered)
        } catch { setSearchResults([]) } finally { setIsSearching(false) }
    }

    async function handleAssignReviewer(userId: string) {
        if (!selectedDraft?.id) return
        const res = await assignConstitutionReviewer(selectedDraft.id, userId)
        if (res.success) { toast.success("Reviewer assigned."); loadReviewers(selectedDraft.id); setSearchQuery(""); setSearchResults([]) }
        else toast.error(res.error || "Failed.")
    }

    async function handleRemoveReviewer(userId: string) {
        if (!selectedDraft?.id) return
        const res = await removeConstitutionReviewer(selectedDraft.id, userId)
        if (res.success) { toast.success("Reviewer removed."); loadReviewers(selectedDraft.id) }
        else toast.error(res.error || "Failed.")
    }

    async function handleSendFeedback() {
        if (!feedbackText.trim() || !selectedDraft?.id) return
        setIsSendingFeedback(true)
        try {
            const res = await submitConstitutionFeedback(selectedDraft.id, feedbackText)
            if (res.success) { toast.success("Feedback submitted."); setFeedbackText(""); loadFeedback(selectedDraft.id) }
            else toast.error(res.error || "Failed.")
        } catch (err: any) { toast.error(err.message) } finally { setIsSendingFeedback(false) }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: Drafts List */}
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
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Constitutional Review Draft 2026" className="border border-gray-200" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Content</label>
                                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Draft text..." rows={12} className="border border-gray-200 font-mono text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Word Document (Optional)</label>
                                    <FileUpload accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onUploadComplete={(url) => setDocumentUrl(url)} label={documentUrl ? "Replace File" : "Upload Document"} />
                                    {documentUrl && <p className="text-xs text-green-600 font-medium truncate">File: {documentUrl}</p>}
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleCreateDraft} disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white">{isSaving ? "Saving..." : "Save Draft"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-3">
                    {drafts.length === 0 ? (
                        <Card className="border border-dashed border-gray-200 bg-gray-50/50">
                            <CardContent className="p-6 text-center text-gray-500 font-medium">No drafts found. Create your first draft.</CardContent>
                        </Card>
                    ) : drafts.map((d) => (
                        <Card key={d.id} onClick={() => { setSelectedDraft(d); setEditMode(false); setEditTitle(d.title); setEditContent(d.content); setEditDocumentUrl(d.documentUrl || ""); setActiveTab("content") }}
                            className={`cursor-pointer transition-all border shadow-sm ${selectedDraft?.id === d.id ? "border-green-600 bg-green-50/40" : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50"}`}>
                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-bold text-gray-900 leading-tight">{d.title}</CardTitle>
                                    <CardDescription className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge variant={d.status === "APPROVED" ? "default" : d.status === "ARCHIVED" ? "secondary" : "outline"}
                                    className={d.status === "APPROVED" ? "bg-green-600 hover:bg-green-600 font-bold" : d.status === "ARCHIVED" ? "bg-gray-300 font-bold text-gray-800" : "border-yellow-200 text-yellow-800 bg-yellow-50 font-bold"}>
                                    {d.status}
                                </Badge>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail Panel */}
            <div className="md:col-span-2">
                {selectedDraft ? (
                    <Card className="border border-gray-200 bg-white shadow-sm h-full">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <div className="space-y-1">
                                {editMode ? (
                                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-xl font-bold border border-gray-200" />
                                ) : (
                                    <CardTitle className="text-2xl font-bold text-gray-900">{selectedDraft.title}</CardTitle>
                                )}
                                <CardDescription className="text-xs text-gray-500">Status: <span className="font-bold">{selectedDraft.status}</span></CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {editMode ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={isSaving}>Cancel</Button>
                                        <Button size="sm" onClick={handleUpdateDraft} disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white">{isSaving ? "Saving..." : "Save"}</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="border-gray-200 text-gray-700"><Edit className="h-4 w-4 mr-1 text-gray-600" /> Edit</Button>
                                        
                                        {selectedDraft.status === "DRAFT" && (
                                            <Button size="sm" onClick={() => handleAdvanceStage(selectedDraft.id, "REVIEW_BRANCH")} disabled={isAdvancing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Start Branch Review</Button>
                                        )}
                                        {selectedDraft.status === "REVIEW_BRANCH" && (
                                            <Button size="sm" onClick={() => { setPendingWorkshopStatus("BRANCH_WORKSHOP"); setWorkshopDialogOpen(true); }} disabled={isAdvancing} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Start Branch Workshop</Button>
                                        )}
                                        {selectedDraft.status === "BRANCH_WORKSHOP" && (
                                            <Button size="sm" onClick={() => handleAdvanceStage(selectedDraft.id, "REVIEW_LGA")} disabled={isAdvancing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Advance to LGA</Button>
                                        )}
                                        {selectedDraft.status === "REVIEW_LGA" && (
                                            <Button size="sm" onClick={() => { setPendingWorkshopStatus("LGA_WORKSHOP"); setWorkshopDialogOpen(true); }} disabled={isAdvancing} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Start LGA Workshop</Button>
                                        )}
                                        {selectedDraft.status === "LGA_WORKSHOP" && (
                                            <Button size="sm" onClick={() => handleAdvanceStage(selectedDraft.id, "REVIEW_STATE")} disabled={isAdvancing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">Advance to State</Button>
                                        )}
                                        {selectedDraft.status === "REVIEW_STATE" && (
                                            <Button size="sm" onClick={() => { setPendingWorkshopStatus("STATE_WORKSHOP"); setWorkshopDialogOpen(true); }} disabled={isAdvancing} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Start State Workshop</Button>
                                        )}
                                        {selectedDraft.status === "STATE_WORKSHOP" && (
                                            <Button size="sm" onClick={() => handleAdvanceStage(selectedDraft.id, "REVIEW_NATIONAL")} disabled={isAdvancing} className="bg-pink-600 hover:bg-pink-700 text-white font-bold">Advance to National</Button>
                                        )}
                                        {selectedDraft.status === "REVIEW_NATIONAL" && (
                                            <Button size="sm" onClick={() => { setPendingWorkshopStatus("NATIONAL_WORKSHOP"); setWorkshopDialogOpen(true); }} disabled={isAdvancing} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Start National Workshop</Button>
                                        )}
                                        {selectedDraft.status === "NATIONAL_WORKSHOP" && (
                                            <Button size="sm" onClick={() => handleApproveDraft(selectedDraft.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold"><CheckCircle2 className="h-4 w-4 mr-1" /> Final Approve</Button>
                                        )}

                                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(selectedDraft.id)} className="bg-red-600 hover:bg-red-700"><Trash className="h-4 w-4" /></Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6">
                            {(["content", "reviewers", "feedback"] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-green-600 text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
                                    {tab === "content" && <FileText className="h-4 w-4 inline mr-1.5" />}
                                    {tab === "reviewers" && <Users className="h-4 w-4 inline mr-1.5" />}
                                    {tab === "feedback" && <MessageSquare className="h-4 w-4 inline mr-1.5" />}
                                    {tab} {tab === "reviewers" && `(${reviewers.length})`} {tab === "feedback" && `(${feedbackList.length})`}
                                </button>
                            ))}
                        </div>

                        <CardContent className="p-6">
                            {/* Content Tab */}
                            {activeTab === "content" && (
                                editMode ? (
                                    <div className="space-y-3">
                                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="w-full border border-gray-200 font-mono text-sm leading-relaxed" />
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">Word Document (Optional)</label>
                                            <FileUpload accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onUploadComplete={(url) => setEditDocumentUrl(url)} label={editDocumentUrl ? "Replace File" : "Upload Document"} />
                                            {editDocumentUrl && <p className="text-xs text-green-600 font-medium truncate">File: {editDocumentUrl}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="whitespace-pre-line text-green-900 leading-relaxed font-medium bg-green-50/40 p-4 rounded-xl border border-green-100/60 max-h-[60vh] overflow-y-auto">{selectedDraft.content}</div>
                                        {selectedDraft.documentUrl && (
                                            <div className="flex justify-end pt-2">
                                                <a href={selectedDraft.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg transition-colors cursor-pointer">📥 Download / Review Original Document</a>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {/* Reviewers Tab */}
                            {activeTab === "reviewers" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Add Reviewer (Search by name or email)</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input value={searchQuery} onChange={(e) => handleSearchUsers(e.target.value)} placeholder="Type name or email..." className="pl-10 border border-gray-200" />
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm max-h-48 overflow-y-auto">
                                                {searchResults.map((u: any) => (
                                                    <button key={u.id} onClick={() => handleAssignReviewer(u.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left border-b border-gray-50 last:border-0">
                                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{(u.name || u.email)?.[0]?.toUpperCase()}</div>
                                                        <div><p className="text-sm font-semibold text-gray-900">{u.name || "No Name"}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                                        <Plus className="h-4 w-4 text-green-600 ml-auto" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">Assigned Reviewers ({reviewers.length})</h4>
                                        {reviewers.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No reviewers assigned yet.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {reviewers.map((r: any) => (
                                                    <div key={r.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{(r.userName || r.userEmail)?.[0]?.toUpperCase()}</div>
                                                            <div><p className="text-sm font-semibold text-gray-900">{r.userName || "No Name"}</p><p className="text-xs text-gray-500">{r.userEmail}</p></div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveReviewer(r.userId)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Feedback Tab */}
                            {activeTab === "feedback" && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Write your feedback or comment..." rows={3} className="flex-1 border border-gray-200 text-sm" />
                                        <Button onClick={handleSendFeedback} disabled={isSendingFeedback || !feedbackText.trim()} className="bg-green-700 hover:bg-green-800 text-white self-end"><Send className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                        {feedbackList.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic text-center py-8">No feedback yet. Be the first to comment.</p>
                                        ) : feedbackList.map((f: any) => (
                                            <div key={f.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">{(f.userName || f.userEmail)?.[0]?.toUpperCase()}</div>
                                                    <span className="text-sm font-semibold text-gray-900">{f.userName || "Anonymous"}</span>
                                                    <span className="text-xs text-gray-400 ml-auto">{new Date(f.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{f.comment}</p>
                                            </div>
                                        ))}
                                    </div>
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
                        <AlertDialogDescription className="text-gray-500">This action cannot be undone. This will permanently delete the selected draft.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDraft} className="bg-red-600 hover:bg-red-700 text-white font-bold">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={workshopDialogOpen} onOpenChange={setWorkshopDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Schedule Workshop</DialogTitle>
                        <DialogDescription>Please select a date and time for the virtual harmonisation workshop.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input type="datetime-local" value={workshopDate} onChange={(e) => setWorkshopDate(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWorkshopDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => selectedDraft?.id && handleAdvanceStage(selectedDraft.id, pendingWorkshopStatus, workshopDate)} disabled={!workshopDate || isAdvancing} className="bg-green-600 text-white hover:bg-green-700">Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
