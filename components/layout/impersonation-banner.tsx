"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, Undo2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ImpersonationBanner() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    if (!session?.user?.impersonatorId) return null

    const handleRevert = async () => {
        try {
            setIsLoading(true)
            toast.loading("Restoring admin session...", { id: "revert" })
            await update({ action: "revert_impersonate" })
            toast.success("Admin session restored", { id: "revert" })
            router.push("/dashboard/admin")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to restore session", { id: "revert" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between sticky top-0 z-[60] animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldAlert className="h-4 w-4" />
                <span>You are currently impersonating <strong>{session.user.name}</strong> ({session.user.email})</span>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRevert} 
                disabled={isLoading}
                className="h-7 text-xs font-bold"
            >
                <Undo2 className="h-3 w-3 mr-1" />
                Exit Impersonation
            </Button>
        </div>
    )
}
