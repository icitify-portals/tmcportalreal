"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { syncGeneralPayments } from "@/lib/actions/payments"

export function SyncPaymentsButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const result = await syncGeneralPayments()
            if (result.success) {
                if (result.count! > 0) {
                    toast.success(`Successfully synced ${result.count} payments!`)
                } else {
                    toast.info(result.message || `Checked ${result.totalChecked} payments. All up to date.`)
                }
            } else {
                toast.error(result.error || "Failed to sync payments")
            }
        } catch (error) {
            console.error("Sync error:", error)
            toast.error("An error occurred during sync")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync} 
            disabled={isLoading}
            className="flex items-center gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="h-4 w-4" />
            )}
            Sync with Paystack
        </Button>
    )
}
