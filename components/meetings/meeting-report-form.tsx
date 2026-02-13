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
    const [url, setUrl] = useState("")

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await submitReport(meetingId, title, url)
            if (res.success) {
                toast.success(res.isLate ? "Report submitted (LATE)" : "Report submitted successfully")
                setTitle("")
                setUrl("")
            } else {
                toast.error(res.error || "Failed to submit report")
            }
        } catch (e) {
            toast.error("Failed to submit report")
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
                <Label>Report Link (PDF/Doc)</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required />
            </div>
            <Button type="submit" disabled={loading} size="sm">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
            </Button>
        </form>
    )
}
