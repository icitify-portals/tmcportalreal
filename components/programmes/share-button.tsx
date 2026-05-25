"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

export function ShareButton({ title, text, url }: { title: string, text: string, url: string }) {
    const handleShare = async () => {
        const shareData = {
            title,
            text,
            url,
        }

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData)
                toast.success("Shared successfully!")
            } catch (err) {
                console.error("Error sharing:", err)
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(`${text}\n${url}`)
                toast.success("Link copied to clipboard!")
            } catch (err) {
                toast.error("Failed to copy link.")
            }
        }
    }

    return (
        <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
        </Button>
    )
}
