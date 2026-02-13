"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { joinMeeting, leaveMeeting, submitReport } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2, LogIn, LogOut } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function MeetingRoomActions({ meetingId, isPresent, joinedAt, leftAt }: any) {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    async function onJoin() {
        setLoading(true)
        try {
            await joinMeeting(meetingId)
            toast.success("You have checked in")
        } catch (e) { toast.error("Failed to check in") }
        finally { setLoading(false) }
    }

    async function onLeave() {
        setLoading(true)
        try {
            await leaveMeeting(meetingId)
            toast.success("You have checked out")
        } catch (e) { toast.error("Failed to check out") }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                {!isPresent ? (
                    <Button onClick={onJoin} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                        Check In (Join)
                    </Button>
                ) : (
                    <Button onClick={onLeave} disabled={loading} variant="outline" className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                        Check Out (Leave)
                    </Button>
                )}
            </div>
            {joinedAt && (
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Checked in at: {mounted ? format(new Date(joinedAt), "p") : ""}
                </p>
            )}
            {leftAt && (
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Checked out at: {mounted ? format(new Date(leftAt), "p") : ""}
                </p>
            )}
        </div>
    )
}

export function MeetingReportForm({ meetingId }: { meetingId: string }) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await submitReport(meetingId, title, content)
            toast.success("Report submitted")
            setTitle("")
            setContent("")
        } catch (e) { toast.error("Failed to submit") }
        finally { setLoading(false) }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3 border p-4 rounded-md">
            <div className="space-y-1">
                <Label>Report Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Financial Report" required />
            </div>
            <div className="space-y-1">
                <Label>Link / Content</Label>
                <Input value={content} onChange={e => setContent(e.target.value)} placeholder="Google Doc Link or Text" required />
            </div>
            <Button type="submit" disabled={loading} size="sm">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
            </Button>
        </form>
    )
}
