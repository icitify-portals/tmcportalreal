"use client"

import { useState } from "react"
import { Button as UIButton } from "@/components/ui/button"
import { Play, Square, Loader2 } from "lucide-react"
import { startMeeting, endMeeting } from "@/lib/actions/meetings"
import { toast } from "sonner"

export function MeetingControlButtons({ meetingId, status }: { meetingId: string, status: string }) {
    const [loading, setLoading] = useState(false)

    async function handleStart() {
        setLoading(true)
        try {
            const res = await startMeeting(meetingId)
            if (res.success) {
                toast.success("Meeting started successfully")
            } else {
                toast.error(res.error || "Failed to start meeting")
            }
        } catch (error) {
            toast.error("An error occurred while starting the meeting")
        } finally {
            setLoading(false)
        }
    }

    async function handleEnd() {
        setLoading(true)
        try {
            const res = await endMeeting(meetingId)
            if (res.success) {
                toast.success("Meeting ended successfully")
            } else {
                toast.error(res.error || "Failed to end meeting")
            }
        } catch (error) {
            toast.error("An error occurred while ending the meeting")
        } finally {
            setLoading(false)
        }
    }

    if (status === 'ENDED') return null

    return (
        <div className="flex items-center gap-2">
            {status === 'SCHEDULED' && (
                <UIButton onClick={handleStart} disabled={loading} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                    Start Meeting
                </UIButton>
            )}
            {status === 'ONGOING' && (
                <UIButton onClick={handleEnd} disabled={loading} size="sm" variant="destructive">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4 fill-current" />}
                    End Meeting
                </UIButton>
            )}
        </div>
    )
}
