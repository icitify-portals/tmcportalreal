"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import "@livekit/components-styles"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function GuestJoinForm({ 
    virtualRoomId, 
    meetingTitle,
    isLoggedIn,
    defaultName 
}: { 
    virtualRoomId: string, 
    meetingTitle: string,
    isLoggedIn: boolean,
    defaultName: string
}) {
    const [name, setName] = useState(defaultName)
    const [token, setToken] = useState("")
    const [loading, setLoading] = useState(false)
    const [joined, setJoined] = useState(false)

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return toast.error("Please enter your name")

        setLoading(true)
        try {
            // We use the LiveKit API route, passing a special guest flag and name
            const res = await fetch(`/api/livekit?room=${virtualRoomId}&guestName=${encodeURIComponent(name)}`)
            const data = await res.json()

            if (data.token) {
                setToken(data.token)
                setJoined(true)
            } else {
                toast.error("Failed to get room access token")
            }
        } catch (error) {
            toast.error("Connection error")
        } finally {
            setLoading(false)
        }
    }

    if (joined && token) {
        return (
            <div className="fixed inset-0 z-50 bg-background">
                <LiveKitRoom
                    video={false}
                    audio={false}
                    token={token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                    data-lk-theme="default"
                    style={{ height: '100dvh' }}
                >
                    <VideoConference />
                </LiveKitRoom>
            </div>
        )
    }

    return (
        <form onSubmit={handleJoin} className="space-y-4">
            {!isLoggedIn && (
                <div className="space-y-2">
                    <Label>Enter your name to join</Label>
                    <Input 
                        placeholder="John Doe" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoggedIn ? "Join Room" : "Join as Guest"}
            </Button>
        </form>
    )
}
