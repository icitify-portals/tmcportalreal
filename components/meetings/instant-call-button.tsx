"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall, Loader2 } from "lucide-react"
import { startInstantGroupCall } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function InstantCallButton({ groupId, groupName }: { groupId: string, groupName: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleStartCall() {
        setLoading(true)
        try {
            const res = await startInstantGroupCall(groupId)
            if (res.success) {
                toast.success(`Instant call started for ${groupName}!`)
                // Redirect straight into the room
                router.push(`/dashboard/member/meetings/${res.meetingId}/room`)
            } else {
                toast.error(res.error || "Failed to start call")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleStartCall} disabled={loading} size="sm" variant="outline" className="border-green-200 hover:bg-green-50 hover:text-green-700 text-green-600">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
            Instant Call
        </Button>
    )
}
