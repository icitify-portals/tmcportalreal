"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { sendCertificatesAction } from "@/lib/actions/programmes"
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

export function SendCertificatesButton({ programmeId }: { programmeId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSend() {
        setIsLoading(true)
        try {
            const result = await sendCertificatesAction(programmeId)
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.error || "Failed to send certificates")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="h-9 border-purple-200 text-purple-700 hover:bg-purple-50"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Email Certificates
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Send Certificates to All Attendees?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will generate and send certificates of participation to all participants who are marked as <strong>ATTENDED</strong>. This action may take a moment depending on the number of participants.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleSend}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        Yes, Send Now
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
