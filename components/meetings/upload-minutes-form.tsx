"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { uploadMinutes } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UploadMinutesForm({ meetingId }: { meetingId: string }) {
    const [loading, setLoading] = useState(false)
    const [url, setUrl] = useState("")

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await uploadMinutes(meetingId, url)
            toast.success("Minutes uploaded & Members notified")
            setUrl("")
        } catch (e) { toast.error("Failed to upload") }
        finally { setLoading(false) }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
                <Label>Link to Minutes (PDF/Doc)</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required />
            </div>
            <Button type="submit" disabled={loading} size="sm">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Minutes
            </Button>
        </form>
    )
}
