"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { updateUserProfileImage } from "@/lib/actions/users"
import { useRouter } from "next/navigation"

interface ProfileImageUploadProps {
    currentImage: string | null
    userName: string
}

export function ProfileImageUpload({ currentImage, userName }: ProfileImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB.")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", "profiles")

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                const updateResult = await updateUserProfileImage(data.url)
                if (updateResult.success) {
                    setPreviewUrl(data.url)
                    toast.success("Profile image updated successfully!")
                    router.refresh()
                } else {
                    toast.error(updateResult.error || "Failed to update profile image record.")
                }
            } else {
                toast.error(data.error || "Upload failed.")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("An error occurred during upload.")
        } finally {
            setIsUploading(false)
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={previewUrl || ""} alt={userName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                        {userName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                
                {isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}
                
                <button
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-20"
                    title="Change Profile Photo"
                >
                    <Camera className="h-5 w-5" />
                </button>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />
            
            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 5MB (JPG, PNG, WebP)
                </p>
            </div>
        </div>
    )
}
