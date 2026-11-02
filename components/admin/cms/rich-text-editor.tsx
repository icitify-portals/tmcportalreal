"use client"

import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Upload,
    Heading1,
    Heading2,
    Quote,
    Undo,
    Redo,
    Loader2
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
    uploadCategory?: string
}

export function RichTextEditor({
    content,
    onChange,
    editable = true,
    uploadCategory = "posts"
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                link: {
                    openOnClick: false
                }
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4',
                },
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
        immediatelyRender: false,
    })

    const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editor) return

        setIsUploadingImage(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", uploadCategory)

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.url) {
                throw new Error(data.error || "Failed to upload image")
            }
            editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
            toast.success("Picture inserted into content")
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
        } finally {
            setIsUploadingImage(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    if (!editor) {
        return null
    }

    if (!editable) {
        return <EditorContent editor={editor} />
    }

    return (
        <div className="border rounded-md overflow-hidden bg-background">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
            />
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(editor.isActive('bold') && "bg-muted")}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(editor.isActive('italic') && "bg-muted")}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn(editor.isActive('underline') && "bg-muted")}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(editor.isActive('strike') && "bg-muted")}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn(editor.isActive('heading', { level: 1 }) && "bg-muted")}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(editor.isActive('heading', { level: 2 }) && "bg-muted")}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(editor.isActive('bulletList') && "bg-muted")}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(editor.isActive('orderedList') && "bg-muted")}
                    title="Ordered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn(editor.isActive('blockquote') && "bg-muted")}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        const previousUrl = editor.getAttributes('link').href
                        const url = window.prompt('URL', previousUrl)

                        if (url === null) {
                            return
                        }

                        if (url === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run()
                            return
                        }

                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                    }}
                    className={cn(editor.isActive('link') && "bg-muted")}
                    title="Insert Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="gap-1.5 px-2 text-xs"
                    title="Upload Picture into Content"
                >
                    {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    <span>Upload Image</span>
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        const url = window.prompt('Image URL')
                        if (url) {
                            editor.chain().focus().setImage({ src: url }).run()
                        }
                    }}
                    title="Insert Image from URL"
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>

                <div className="flex-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Area */}
            <div className="bg-white dark:bg-black min-h-[300px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
