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
    const [file, setFile] = useState<File | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!file) return;

        setLoading(true)
        try {
            // 1. Upload to storage
            const formData = new FormData()
            formData.append("file", file)
            formData.append("category", "meetings/minutes")

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            })

            const uploadData = await uploadRes.json()

            if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

            // 2. Record in database
            await uploadMinutes(meetingId, uploadData.url)

            toast.success("Minutes uploaded & Members notified")
            setFile(null)
            // Reset input
            const input = document.getElementById('minutes-file') as HTMLInputElement
            if (input) input.value = ''

        } catch (e: any) {
            toast.error(e.message || "Failed to upload")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="minutes-file">Pick File (PDF/Word)</Label>
                <Input
                    id="minutes-file"
                    type="file"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx"
                    required
                />
                {file && (
                    <p className="text-xs text-muted-foreground">
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                )}
            </div>
            <Button type="submit" disabled={loading || !file} size="sm" className="w-full">
                {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                    "Publish Minutes"
                )}
            </Button>
        </form>
    )
}
