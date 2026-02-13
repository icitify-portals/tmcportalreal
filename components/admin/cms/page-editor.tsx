
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { RichTextEditor } from "@/components/admin/cms/rich-text-editor"
import { savePage } from "@/lib/actions/pages"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

const PageSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
    content: z.string().optional(),
    isPublished: z.boolean().default(false),
    organizationId: z.string().min(1, "Organization is required"),
})

export default function PageEditor({ pageId, initialData, organizationId }: { pageId?: string, initialData?: any, organizationId: string }) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm({
        resolver: zodResolver(PageSchema),
        defaultValues: {
            title: initialData?.title || "",
            slug: initialData?.slug || "",
            content: initialData?.content || "",
            isPublished: initialData?.isPublished ?? false,
            organizationId: organizationId,
        }
    })

    async function onSubmit(data: z.infer<typeof PageSchema>) {
        setIsSaving(true)
        try {
            const result = await savePage({ ...data, id: pageId, organizationId })
            if (result.success) {
                toast.success("Page saved successfully")
                if (!pageId) {
                    router.push("/dashboard/admin/cms/pages")
                }
            } else {
                toast.error(result.error || "Failed to save page")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    // Auto-generate slug from title if new page
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("title", e.target.value)
        if (!pageId) {
            const slug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '')
            form.setValue("slug", slug)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Pages
                </Button>
                <div className="flex items-center gap-2">
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {pageId ? "Update Page" : "Create Page"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Page Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Our Programmes" {...field} value={field.value || ''} onChange={(e) => {
                                                        field.onChange(e)
                                                        handleTitleChange(e)
                                                    }} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="mt-6">
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Content</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor
                                                            content={field.value || ""}
                                                            onChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL Slug</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="our-programmes" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormDescription>
                                                    The page will be matching /{field.value}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isPublished"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Published</FormLabel>
                                                    <FormDescription>
                                                        Visible to public
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
