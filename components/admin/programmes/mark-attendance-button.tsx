"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserCheck, Loader2, RotateCcw } from "lucide-react"
import { markAttendance, resetAttendance } from "@/lib/actions/programmes"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function MarkAttendanceButton({ registrationId, status, userName }: { registrationId: string, status: string, userName: string }) {
    const [isLoading, setIsLoading] = useState(false)

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

    async function handleReset() {
        setIsLoading(true)
        try {
            const res = await resetAttendance(registrationId)
            if (res.success) {
                toast.success("Attendance reset to PAID")
            } else {
                toast.error(res.error || "Failed to reset attendance")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (status === 'ATTENDED') {
        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-green-600 hover:bg-amber-50 hover:text-amber-600" 
                        disabled={isLoading}
                        title="Reset to Paid"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Attendance?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the Check-In/Out records for <strong>{userName}</strong> and revert status to PAID.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset} className="bg-amber-600 hover:bg-amber-700">
                            Reset to Paid
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    return (
        <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 hover:bg-green-50" 
            onClick={handleMark} 
            disabled={isLoading}
            title="Mark Attended"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4 text-gray-400 hover:text-green-600" />}
        </Button>
    )
}
