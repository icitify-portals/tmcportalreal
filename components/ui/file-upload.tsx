"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FileUploadProps {
    onUploadComplete: (url: string, file: File) => void
    onUploadMultipleComplete?: (urls: string[], files: File[]) => void
    multiple?: boolean
    endpoint?: string
    accept?: string
    className?: string
    variant?: "default" | "outline" | "secondary" | "ghost"
    label?: string
    disabled?: boolean
    maxSizeMB?: number
}

export function FileUpload({
    onUploadComplete,
    onUploadMultipleComplete,
    multiple = false,
    endpoint = "/api/upload",
    accept,
    className,
    variant = "outline",
    label = "Upload File",
    disabled = false,
    maxSizeMB = 50
}: FileUploadProps) {
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const validFiles = files.filter(f => f.size <= maxSizeMB * 1024 * 1024)
        if (validFiles.length < files.length) {
            toast.error(`Some files exceed ${maxSizeMB}MB limit and were skipped`)
        }
        if (validFiles.length === 0) return

        setLoading(true)
        try {
            if (multiple && onUploadMultipleComplete) {
                const urls: string[] = []
                const uploadedFiles: File[] = []

                for (const file of validFiles) {
                    const formData = new FormData()
                    formData.append("file", file)

                    let category = "documents"
                    if (file.type.startsWith("image/")) category = "images"
                    else if (file.type.startsWith("audio/")) category = "audio"
                    else if (file.type.startsWith("video/")) category = "video"

                    formData.append("category", category)

                    const res = await fetch(endpoint, {
                        method: "POST",
                        body: formData
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || "Upload failed")
                    urls.push(data.url)
                    uploadedFiles.push(file)
                }

                toast.success(`${validFiles.length} files uploaded successfully`)
                onUploadMultipleComplete(urls, uploadedFiles)
            } else {
                const file = validFiles[0]
                const formData = new FormData()
                formData.append("file", file)

                let category = "documents"
                if (file.type.startsWith("image/")) category = "images"
                else if (file.type.startsWith("audio/")) category = "audio"
                else if (file.type.startsWith("video/")) category = "video"

                formData.append("category", category)

                const res = await fetch(endpoint, {
                    method: "POST",
                    body: formData
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Upload failed")

                toast.success("File uploaded successfully")
                onUploadComplete(data.url, file)
            }
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Failed to upload file")
        } finally {
            setLoading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    const triggerUpload = () => {
        inputRef.current?.click()
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                disabled={disabled || loading}
            />
            <Button
                type="button"
                variant={variant}
                onClick={triggerUpload}
                disabled={disabled || loading}
                className="gap-2"
                size="sm"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                {loading ? "Uploading..." : label}
            </Button>
        </div>
    )
}
