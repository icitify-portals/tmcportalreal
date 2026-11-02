"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/admin/cms/rich-text-editor"
import { toast } from "sonner"
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react"

interface PostFormProps {
    initialData?: {
        id: string
        title: string
        content: string
        excerpt?: string | null
        coverImage?: string | null
        postType?: "NEWS" | "EVENT" | "ANNOUNCEMENT" | null
        isPublished?: boolean | null
        organizationId?: string
    }
}

export function PostForm({ initialData }: PostFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        content: initialData?.content || "",
        excerpt: initialData?.excerpt || "",
        coverImage: initialData?.coverImage || "",
        type: initialData?.postType || "NEWS",
        isPublished: initialData?.isPublished ?? false,
    })

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingCover(true)
        const uploadData = new FormData()
        uploadData.append("file", file)
        uploadData.append("category", "posts")

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadData,
            })
            const data = await res.json()
            if (!res.ok || !data.url) {
                throw new Error(data.error || "Failed to upload cover image")
            }
            setFormData(prev => ({ ...prev, coverImage: data.url }))
            toast.success("Cover picture uploaded successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to upload cover picture")
        } finally {
            setIsUploadingCover(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const strippedContent = formData.content.replace(/<[^>]*>?/gm, "").trim()
        const hasEmbeddedImage = /<img\s/i.test(formData.content)
        if (!strippedContent && !hasEmbeddedImage) {
            toast.error("Please enter post content")
            return
        }

        setIsLoading(true)

        try {
            const url = initialData?.id ? `/api/posts/${initialData.id}` : "/api/posts"
            const method = initialData?.id ? "PATCH" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || `Failed to ${initialData?.id ? "update" : "create"} post`)
            }

            toast.success(initialData?.id ? "Post updated successfully" : "Post created successfully")
            router.push("/dashboard/admin/posts")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-card">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter post title"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as "NEWS" | "EVENT" | "ANNOUNCEMENT" }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEWS">News</SelectItem>
                            <SelectItem value="EVENT">Event</SelectItem>
                            <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Publish Immediately</Label>
                        <div className="text-xs text-muted-foreground">
                            Make visible on the public news feed
                        </div>
                    </div>
                    <Switch
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                    />
                </div>
            </div>

            {/* Cover Picture Upload */}
            <div className="space-y-3">
                <Label>Cover Picture (Optional)</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        disabled={isUploadingCover}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingCover}
                        className="shrink-0"
                    >
                        {isUploadingCover ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload Picture
                    </Button>
                    <Input
                        placeholder="Or paste an image URL..."
                        value={formData.coverImage}
                        onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                        className="flex-1"
                    />
                </div>

                {formData.coverImage ? (
                    <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                            title="Remove cover picture"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Supported formats: JPG, PNG, WEBP, GIF (max 50MB).</span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt / Summary (Optional)</Label>
                <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief summary displayed on news cards..."
                    className="h-20"
                />
            </div>

            <div className="space-y-2">
                <Label>Post Content</Label>
                <RichTextEditor
                    content={formData.content}
                    onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                    uploadCategory="posts"
                />
                <p className="text-xs text-muted-foreground">
                    Use the editor toolbar to format text, add links, or upload inline pictures directly into your post.
                </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploadingCover}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData?.id ? "Save Changes" : "Create Post"}
                </Button>
            </div>
        </form>
    )
}
