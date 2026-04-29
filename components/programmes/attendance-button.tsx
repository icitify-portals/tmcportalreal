"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { recordAttendance } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { LogIn, LogOut, Loader2 } from "lucide-react"

interface AttendanceButtonProps {
    registrationId: string
    checkInTime?: Date | null
    checkOutTime?: Date | null
}

export function AttendanceButton({ registrationId, checkInTime, checkOutTime }: AttendanceButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleAttendance = async () => {
        setLoading(true)
        try {
            const result = await recordAttendance(registrationId)
            if (result.success) {
                toast.success(result.type === 'CHECK_IN' ? "Checked In Successfully" : "Checked Out Successfully")
            } else {
                toast.error(result.error || "Failed to record attendance")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (checkInTime && checkOutTime) {
        return (
            <Button disabled className="w-full bg-gray-100 text-gray-500 border-gray-200">
                Attendance Completed
            </Button>
        )
    }

    return (
        <Button 
            onClick={handleAttendance} 
            disabled={loading}
            className={`w-full h-14 text-lg font-bold shadow-lg transition-all active:scale-95 ${!checkInTime ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
        >
            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : !checkInTime ? (
                <>
                    <LogIn className="w-6 h-6 mr-2" />
                    Record Check-In
                </>
            ) : (
                <>
                    <LogOut className="w-6 h-6 mr-2" />
                    Record Check-Out
                </>
            )}
        </Button>
    )
}
