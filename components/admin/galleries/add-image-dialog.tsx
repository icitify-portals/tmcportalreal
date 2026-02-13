"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { addImageToGallery } from "@/lib/actions/galleries"
import { toast } from "sonner"
import { Loader2, Plus, Image as ImageIcon, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ImageEditor } from "@/components/ui/image-editor"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Form schema now just handles text, file handling is manual state
const formSchema = z.object({
    caption: z.string().optional(),
})

interface AddImageDialogProps {
    galleryId: string
}

export function AddImageDialog({ galleryId }: AddImageDialogProps) {
    const [open, setOpen] = useState(false)
    const [editorOpen, setEditorOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            caption: "",
        },
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File is too large (Max 5MB)")
                return
            }
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                toast.error("Invalid file type")
                return
            }
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            // Auto open editor? Or let user click? Let's show edit button
        }
    }

    const handleEditorSave = (editedFile: File) => {
        setSelectedFile(editedFile)
        setPreviewUrl(URL.createObjectURL(editedFile))
    }

    async function onSubmit(data: z.infer<typeof formSchema>) {
        if (!selectedFile) {
            toast.error("Please select an image")
            return
        }

        setUploading(true)
        try {
            // 1. Upload File
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("category", "galleries")

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const uploadData = await uploadRes.json()

            if (!uploadRes.ok || !uploadData.success) {
                throw new Error(uploadData.error || "Upload failed")
            }

            // 2. Add to Gallery
            const result = await addImageToGallery(galleryId, {
                imageUrl: uploadData.url,
                caption: data.caption,
            })

            if (result.success) {
                toast.success("Image uploaded successfully")
                setOpen(false)
                form.reset()
                setSelectedFile(null)
                setPreviewUrl(null)
                router.refresh()
            } else {
                toast.error(result.error || "Failed to add image to gallery")
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Photo
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Upload Photo</DialogTitle>
                        <DialogDescription>
                            Select a photo to upload. Max size 5MB.
                        </DialogDescription>
                    </DialogHeader>

                    {previewUrl && (
                        <div className="relative aspect-video rounded-md overflow-hidden bg-muted mb-4 group">
                            <img src={previewUrl} alt="Preview" className="object-contain w-full h-full" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" onClick={() => setEditorOpen(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Image
                                </Button>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {!previewUrl && (
                                <div className="flex items-center justify-center w-full">
                                    <div
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Click to upload image</p>
                                        </div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="caption"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Caption (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Description..." {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                {previewUrl && (
                                    <Button type="button" variant="ghost" onClick={() => {
                                        setSelectedFile(null)
                                        setPreviewUrl(null)
                                    }}>
                                        Change File
                                    </Button>
                                )}
                                <Button type="submit" disabled={uploading}>
                                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {uploading ? "Uploading..." : "Upload & Save"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {selectedFile && (
                <ImageEditor
                    file={selectedFile}
                    open={editorOpen}
                    onOpenChange={setEditorOpen}
                    onSave={handleEditorSave}
                    maxDimensions={{ width: 1920, height: 1080 }}
                />
            )}
        </>
    )
}
