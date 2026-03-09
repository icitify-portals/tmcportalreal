"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { submitReport } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MeetingReportForm({ meetingId }: { meetingId: string }) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [file, setFile] = useState<File | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!file) {
            toast.error("Please select a file")
            return
        }

        setLoading(true)
        try {
            // 1. Upload file
            const formData = new FormData()
            formData.append("file", file)
            formData.append("category", "reports")

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            })

            const uploadData = await uploadRes.json()
            if (!uploadData.success) {
                throw new Error(uploadData.error || "Upload failed")
            }

            // 2. Submit report with resulting URL
            const res = await submitReport(meetingId, title, uploadData.url)
            if (res.success) {
                toast.success(res.isLate ? "Report submitted (LATE)" : "Report submitted successfully")
                setTitle("")
                setFile(null)
                // Reset file input
                const fileInput = document.getElementById("report-file") as HTMLInputElement
                if (fileInput) fileInput.value = ""
            } else {
                toast.error(res.error || "Failed to submit report")
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to submit report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
                <Label>Report Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finance Report" required />
            </div>
            <div className="space-y-1">
                <Label>Select Report (PDF/Doc/Image)</Label>
                <Input
                    id="report-file"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    required
                    className="cursor-pointer"
                />
            </div>
            <Button type="submit" disabled={loading} size="sm">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
            </Button>
        </form>
    )
}
