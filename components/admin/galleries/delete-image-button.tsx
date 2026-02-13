"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { removeImage } from "@/lib/actions/galleries"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteImageButtonProps {
    imageId: string
    galleryId: string
}

export function DeleteImageButton({ imageId, galleryId }: DeleteImageButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        if (!confirm("Are you sure you want to remove this photo?")) return

        setIsDeleting(true)
        try {
            const result = await removeImage(imageId, galleryId)
            if (result.success) {
                toast.success("Photo removed")
                router.refresh()
            } else {
                toast.error("Failed to remove photo")
            }
        } catch (error) {
            toast.error("Error occurred")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
