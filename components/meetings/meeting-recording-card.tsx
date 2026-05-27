"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Copy, Video, RefreshCw, Key } from "lucide-react"

export function MeetingRecordingCard({ meeting }: { meeting: any }) {
    const [generating, setGenerating] = useState(false)
    const [shareCode, setShareCode] = useState(meeting.recordingShareCode)

    async function handleGenerateShareCode() {
        setGenerating(true)
        try {
            const res = await fetch(`/api/meetings/${meeting.id}/recording/share`, {
                method: "POST"
            })
            const data = await res.json()
            if (data.success) {
                setShareCode(data.shareCode)
                toast.success("Recording share code generated")
            } else {
                toast.error(data.error || "Failed to generate code")
            }
        } catch (error) {
            toast.error("Network error")
        } finally {
            setGenerating(false)
        }
    }

    function handleCopyLink() {
        if (!shareCode) return
        const url = `${window.location.origin}/recordings/${shareCode}`
        navigator.clipboard.writeText(url)
        toast.success("Secure recording link copied!")
    }

    if (!meeting.egressId && !meeting.recordingShareCode) {
        return null // Don't show if there's no recording job tracked
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Recording & Playback
                </CardTitle>
                <CardDescription>Manage access to the S3 recording for this meeting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {shareCode ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Secure Share Link</label>
                            <div className="flex gap-2">
                                <Input value={`${window.location.origin}/recordings/${shareCode}`} readOnly />
                                <Button onClick={handleCopyLink} variant="secondary">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Users visiting this link will need to enter the exact code to generate a temporary presigned URL for playback.
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold bg-muted px-2 py-1 rounded">Code: {shareCode}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-4">
                        <p className="text-sm text-muted-foreground">
                            A recording job was started for this meeting. If the recording has finished uploading to Wasabi/S3, you can generate a secure share link below.
                        </p>
                        <Button onClick={handleGenerateShareCode} disabled={generating}>
                            <Key className="mr-2 h-4 w-4" />
                            {generating ? "Generating..." : "Generate Secure Playback Link"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
