"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface RemoveRoleButtonProps {
    userRoleId: string
    userId: string
}

export function RemoveRoleButton({ userRoleId, userId }: RemoveRoleButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleRemove() {
        if (!confirm("Are you sure you want to remove this role?")) return

        setIsLoading(true)
        try {
            // Pass userRoleId correctly as query param or body
            const response = await fetch(`/api/users/${userId}/roles?userRoleId=${userRoleId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to remove role")
            }

            toast.success("Role removed successfully")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={handleRemove}
            disabled={isLoading}
            title="Remove Role"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    )
}
