"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { syncAllProgrammePayments } from "@/lib/actions/programmes"
import { toast } from "sonner"

export function SyncPaymentsButton({ programmeId }: { programmeId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSync() {
        setIsLoading(true)
        try {
            const res = await syncAllProgrammePayments(programmeId)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.error || "Failed to sync")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50" 
            onClick={handleSync}
            disabled={isLoading}
            title="Sync with Paystack"
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync Payments
        </Button>
    )
}
