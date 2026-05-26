"use client"

import { useState } from "react"
import { submitConstitutionFeedback } from "@/lib/actions/constitution"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Send } from "lucide-react"

export function CollationForm({ draftId, submissionLevel }: { draftId: string, submissionLevel: "LGA_COLLATION" | "STATE_COLLATION" | "NATIONAL_COLLATION" }) {
    const [section, setSection] = useState("")
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit() {
        if (!comment.trim()) {
            toast.error("Collation comment cannot be empty.")
            return
        }
        setIsSubmitting(true)
        try {
            const res = await submitConstitutionFeedback(draftId, comment, section, submissionLevel)
            if (res.success) {
                toast.success("Collation submitted successfully.")
                setComment("")
                setSection("")
            } else {
                toast.error(res.error || "Failed to submit collation.")
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Section / Article (Optional)</label>
                <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. Article 5, Section 2" className="border-gray-200" />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Harmonized Collation</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Enter the harmonized feedback for this section..." rows={8} className="border-gray-200 text-sm" />
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold">
                {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Collation</>}
            </Button>
        </div>
    )
}
