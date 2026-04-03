"use client"

import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ImpersonateButton({ targetUserId, isSuperAdmin }: { targetUserId: string, isSuperAdmin: boolean }) {
    const { update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    if (!isSuperAdmin) return null

    const handleImpersonate = async () => {
        try {
            setIsLoading(true)
            toast.loading("Switching context...", { id: "impersonate" })
            await update({ action: "impersonate", targetUserId })
            toast.success("Successfully logged in as user", { id: "impersonate" })
            router.push("/dashboard/member")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to impersonate user", { id: "impersonate" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleImpersonate} disabled={isLoading} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <LogIn className="h-4 w-4 mr-2" />
            Login As
        </Button>
    )
}
