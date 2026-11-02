"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DeletePostButton({ postId, postTitle }: { postId: string; postTitle: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) {
            return
        }

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to delete post")
            }
            toast.success("Post deleted")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete post")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete post"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
        </Button>
    )
}
