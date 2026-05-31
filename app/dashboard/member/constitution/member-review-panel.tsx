"use client"

import { useState } from "react"
import { submitConstitutionFeedback } from "@/lib/actions/constitution"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Send, FileText } from "lucide-react"

export function MemberReviewPanel({ draftId, user }: { draftId: string, user?: any }) {
    const [section, setSection] = useState("")
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const [showGuidelines, setShowGuidelines] = useState(false)
    const [hasReadGuidelines, setHasReadGuidelines] = useState(false)

    const templateText = `TMC CONSTITUTION REVIEW INPUT TEMPLATE.*

PERSONAL DETAILS
• Full Name: ${user?.name || ""}
• LG: 
• Branch: 
• Designation/Office (if applicable): 
• Contact Number: 
• Email Address (Optional): ${user?.email || ""}

INPUTS

ITEM 1: Section X, Sub section Y

Existing Provision: 

Proposed Amendment/Inputs:

Reason/Justification:

`

    async function handleSubmit() {
        if (!comment.trim()) {
            toast.error("Please enter your observation.")
            return
        }
        setIsSubmitting(true)
        try {
            const res = await submitConstitutionFeedback(draftId, comment, section, "MEMBER")
            if (res.success) {
                toast.success("Observation submitted successfully. Thank you for your feedback.")
                setComment("")
                setSection("")
                setHasReadGuidelines(false)
            } else {
                toast.error(res.error || "Failed to submit observation.")
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    function acceptGuidelines() {
        setHasReadGuidelines(true)
        setShowGuidelines(false)
        if (!comment) {
            setComment(templateText)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Section / Article (Optional)</label>
                <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. Article 5, Section 2" className="border-gray-200" />
            </div>

            {!hasReadGuidelines ? (
                <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                            <FileText className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Review Guidelines</h3>
                        <p className="text-sm text-gray-500 mt-1">You must read the review guidelines and format before submitting your observations.</p>
                    </div>
                    <Button onClick={() => setShowGuidelines(true)} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                        Read Guidelines & Format
                    </Button>
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Observation / Comment</label>
                    <Textarea 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)} 
                        placeholder="Enter your comments or proposed changes here..." 
                        rows={12} 
                        className="border-gray-200 text-sm font-mono" 
                    />
                </div>
            )}

            {hasReadGuidelines && (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold">
                    {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Feedback</>}
                </Button>
            )}

            <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Constitution Review Guidelines</DialogTitle>
                        <DialogDescription>
                            Please format your observations according to the template below. When you click accept, we will automatically load this template for you.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono whitespace-pre-wrap mt-4">
                        {templateText}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setShowGuidelines(false)}>Cancel</Button>
                        <Button onClick={acceptGuidelines} className="bg-green-700 hover:bg-green-800 text-white">
                            I understand, load template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
