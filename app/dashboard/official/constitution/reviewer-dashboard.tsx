"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, AlertCircle, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import {
    submitConstitutionFeedback, getConstitutionFeedback
} from "@/lib/actions/constitution"

interface ReviewerDashboardProps {
    drafts: any[]
}

export function ReviewerDashboard({ drafts }: ReviewerDashboardProps) {
    const [selectedDraft, setSelectedDraft] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<"content" | "feedback">("content")
    
    // Feedback state
    const [feedbackList, setFeedbackList] = useState<any[]>([])
    const [feedbackText, setFeedbackText] = useState("")
    const [isSendingFeedback, setIsSendingFeedback] = useState(false)

    useEffect(() => {
        if (selectedDraft?.constitutionId) {
            loadFeedback(selectedDraft.constitutionId)
        }
    }, [selectedDraft?.constitutionId])

    async function loadFeedback(id: string) {
        const f = await getConstitutionFeedback(id)
        setFeedbackList(f)
    }

    async function handleSendFeedback() {
        if (!feedbackText.trim() || !selectedDraft?.constitutionId) return
        setIsSendingFeedback(true)
        try {
            const res = await submitConstitutionFeedback(selectedDraft.constitutionId, feedbackText)
            if (res.success) {
                toast.success("Observation submitted successfully.")
                setFeedbackText("")
                loadFeedback(selectedDraft.constitutionId)
            } else {
                toast.error(res.error || "Failed to submit observation.")
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSendingFeedback(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: Drafts List */}
            <div className="md:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Review Assignments</h3>
                </div>

                <div className="space-y-3">
                    {drafts.length === 0 ? (
                        <Card className="border border-dashed border-gray-200 bg-gray-50/50">
                            <CardContent className="p-6 text-center text-gray-500 font-medium">
                                No drafts available for your review at this time.
                            </CardContent>
                        </Card>
                    ) : drafts.map((d) => (
                        <Card key={d.constitutionId} onClick={() => { setSelectedDraft(d); setActiveTab("content") }}
                            className={`cursor-pointer transition-all border shadow-sm ${selectedDraft?.constitutionId === d.constitutionId ? "border-green-600 bg-green-50/40" : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50"}`}>
                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-bold text-gray-900 leading-tight">{d.title}</CardTitle>
                                    <CardDescription className="text-xs text-gray-500">{new Date(d.assignedAt).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50 font-bold">
                                    {d.status.replace("REVIEW_", "")}
                                </Badge>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail Panel */}
            <div className="md:col-span-2">
                {selectedDraft ? (
                    <Card className="border border-gray-200 bg-white shadow-sm h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-bold text-gray-900">{selectedDraft.title}</CardTitle>
                                <CardDescription className="text-xs text-gray-500">
                                    Current Stage: <span className="font-bold text-blue-600">{selectedDraft.status.replace("REVIEW_", "")} Review</span>
                                </CardDescription>
                            </div>
                        </CardHeader>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6 shrink-0">
                            {(["content", "feedback"] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-green-600 text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
                                    {tab === "content" && <FileText className="h-4 w-4 inline mr-1.5" />}
                                    {tab === "feedback" && <MessageSquare className="h-4 w-4 inline mr-1.5" />}
                                    {tab === "feedback" ? "Observations" : "Document"}
                                    {tab === "feedback" && ` (${feedbackList.length})`}
                                </button>
                            ))}
                        </div>

                        <CardContent className="p-6 flex-1 overflow-y-auto">
                            {/* Content Tab */}
                            {activeTab === "content" && (
                                <div className="space-y-3 h-full">
                                    <div className="whitespace-pre-line text-green-900 leading-relaxed font-medium bg-green-50/40 p-4 rounded-xl border border-green-100/60 min-h-[40vh]">
                                        {selectedDraft.content}
                                    </div>
                                    {selectedDraft.documentUrl && (
                                        <div className="flex justify-end pt-2">
                                            <a href={selectedDraft.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                                                📥 Download / Review Original Document
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Feedback Tab */}
                            {activeTab === "feedback" && (
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="flex gap-2 shrink-0">
                                        <Textarea 
                                            value={feedbackText} 
                                            onChange={(e) => setFeedbackText(e.target.value)} 
                                            placeholder="Write your observation or comment regarding this draft..." 
                                            rows={3} 
                                            className="flex-1 border border-gray-200 text-sm" 
                                        />
                                        <Button 
                                            onClick={handleSendFeedback} 
                                            disabled={isSendingFeedback || !feedbackText.trim()} 
                                            className="bg-green-700 hover:bg-green-800 text-white self-end"
                                        >
                                            <Send className="h-4 w-4 mr-1" /> Submit
                                        </Button>
                                    </div>
                                    <div className="space-y-3 flex-1 overflow-y-auto pt-4">
                                        {feedbackList.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic text-center py-8">No observations yet. Be the first to comment.</p>
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
                            <p>No draft selected. Select a draft from the list to view it.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
