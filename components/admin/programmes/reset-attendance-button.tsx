"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { resetAttendance } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { RotateCcw, Loader2 } from "lucide-react"
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

export function ResetAttendanceButton({ registrationId, userName }: { registrationId: string, userName: string }) {
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        setLoading(true)
        try {
            const result = await resetAttendance(registrationId)
            if (result.success) {
                toast.success("Attendance reset successfully")
            } else {
                toast.error(result.error || "Failed to reset attendance")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Reset Attendance">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset Attendance?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove the Check-In/Out times for <strong>{userName}</strong> and revert their status to "PAID". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleReset}
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Reset"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
