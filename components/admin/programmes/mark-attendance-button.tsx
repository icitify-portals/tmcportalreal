"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserCheck, Loader2 } from "lucide-react"
import { markAttendance } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function MarkAttendanceButton({ registrationId, status }: { registrationId: string, status: string }) {
    const [isLoading, setIsLoading] = useState(false)

    if (status === 'ATTENDED') return <UserCheck className="h-4 w-4 text-green-600" />

    async function handleMark() {
        setIsLoading(true)
        try {
            const res = await markAttendance(registrationId)
            if (res.success) {
                toast.success("Attendee marked as present")
            } else {
                toast.error(res.error || "Failed to mark attendance")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8" 
            onClick={handleMark} 
            disabled={isLoading}
            title="Mark Attended"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4 text-gray-400 hover:text-green-600" />}
        </Button>
    )
}
