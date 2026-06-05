"use client"

import { useState } from "react"
import { Button as UIButton } from "@/components/ui/button"
import { Play, Square, Loader2, Video, Copy, StopCircle } from "lucide-react"
import { startMeeting, endMeeting } from "@/lib/actions/meetings"
import Link from "next/link"
import { toast } from "sonner"

export function MeetingControlButtons({ meeting }: { meeting: any }) {
    const [loading, setLoading] = useState(false)
    const [recording, setRecording] = useState(!!meeting.egressId)
    const [startingRecording, setStartingRecording] = useState(false)

    async function handleStart() {
        setLoading(true)
        try {
            const res = await startMeeting(meeting.id)
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
            const res = await endMeeting(meeting.id)
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

    async function handleRecordStart() {
        setStartingRecording(true)
        try {
            const res = await fetch("/api/livekit/record/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId: meeting.id })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Recording started")
                setRecording(true)
            } else {
                toast.error(data.error || "Failed to start recording")
            }
        } catch (error) {
            toast.error("Error connecting to server")
        } finally {
            setStartingRecording(false)
        }
    }

    async function handleRecordStop() {
        setStartingRecording(true)
        try {
            const res = await fetch("/api/livekit/record/stop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId: meeting.id })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Recording stopped")
                setRecording(false)
            } else {
                toast.error(data.error || "Failed to stop recording")
            }
        } catch (error) {
            toast.error("Error connecting to server")
        } finally {
            setStartingRecording(false)
        }
    }

    function handleCopyGuestLink() {
        if (!meeting.shareCode) return toast.error("No share code generated for this meeting")
        const url = `${window.location.origin}/live/${meeting.shareCode}`
        navigator.clipboard.writeText(url)
        toast.success("Guest join link copied to clipboard")
    }

    if (meeting.status === 'ENDED') {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <UIButton onClick={handleStart} disabled={loading} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                    Restart Meeting
                </UIButton>
                <UIButton onClick={handleCopyGuestLink} size="sm" variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Live Link
                </UIButton>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {meeting.status === 'SCHEDULED' && (
                <UIButton onClick={handleStart} disabled={loading} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                    Start Meeting
                </UIButton>
            )}
            
            <UIButton onClick={handleCopyGuestLink} size="sm" variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy Live Link
            </UIButton>

            {meeting.status === 'ONGOING' && (
                <>
                    <UIButton asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/dashboard/member/meetings/${meeting.id}/room`}>Join Room</Link>
                    </UIButton>
                    
                    {!recording ? (
                        <UIButton onClick={handleRecordStart} disabled={startingRecording} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                            {startingRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                            Record to S3
                        </UIButton>
                    ) : (
                        <UIButton onClick={handleRecordStop} disabled={startingRecording} size="sm" className="bg-orange-800 hover:bg-orange-900 text-white animate-pulse">
                            {startingRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StopCircle className="mr-2 h-4 w-4" />}
                            Recording...
                        </UIButton>
                    )}

                    <UIButton onClick={handleEnd} disabled={loading} size="sm" variant="destructive">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4 fill-current" />}
                        End Meeting
                    </UIButton>
                </>
            )}
        </div>
    )
}
