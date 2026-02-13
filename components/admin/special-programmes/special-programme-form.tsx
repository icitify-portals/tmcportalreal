"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2, Plus, Trash2, Save } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createSpecialProgramme, updateSpecialProgramme } from "@/lib/actions/special-programmes"
import { Card, CardContent } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"

const formSchema = z.object({
    category: z.enum(['TESKIYAH_WORKSHOP', 'FRIDAY_KHUTHBAH', 'PRESS_RELEASE', 'STATE_OF_THE_NATION', 'OTHER']),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    summary: z.string().optional(),
    year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
    date: z.date().optional(),
    imageUrl: z.string().optional(),
    files: z.array(z.object({
        title: z.string().min(1, "File title is required"),
        url: z.string().min(1, "File URL is required"),
        type: z.enum(['AUDIO', 'VIDEO', 'DOCUMENT', 'OTHER']),
        order: z.number().int().default(0),
    }))
})

type FormValues = z.infer<typeof formSchema>


interface SpecialProgrammeFormProps {
    initialData?: any
}

export function SpecialProgrammeForm({ initialData }: SpecialProgrammeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    const isEditing = !!initialData

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,


        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            summary: initialData?.summary || "",
            category: initialData?.category || "TESKIYAH_WORKSHOP",
            year: initialData?.year || new Date().getFullYear(),
            imageUrl: initialData?.imageUrl || "",
            date: initialData?.date ? new Date(initialData.date) : undefined,
            files: initialData?.files?.length > 0
                ? initialData.files.map((f: any) => ({
                    title: f.title,
                    url: f.url,
                    type: f.type,
                    order: f.order
                }))
                : [{ title: "Audio Recording", url: "", type: "AUDIO", order: 1 }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "files"
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            const result = isEditing
                ? await updateSpecialProgramme(
                    initialData.id,
                    {
                        category: values.category,
                        title: values.title,
                        description: values.description,
                        summary: values.summary,
                        year: values.year,
                        date: values.date,
                        imageUrl: values.imageUrl,
                        isPublished: true,
                    },
                    values.files
                )
                : await createSpecialProgramme(
                    {
                        category: values.category,
                        title: values.title,
                        description: values.description,
                        summary: values.summary,
                        year: values.year,
                        date: values.date,
                        imageUrl: values.imageUrl,
                        isPublished: true,
                    },
                    values.files
                )

            if (result.success) {
                toast.success(isEditing ? "Archive updated" : "Archived successfully")
                router.push("/dashboard/admin/special-programmes")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to save")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control as any}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Programme Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TESKIYAH_WORKSHOP">Teskiyah Workshop</SelectItem>
                                        <SelectItem value="FRIDAY_KHUTHBAH">Friday Khuthbah</SelectItem>
                                        <SelectItem value="PRESS_RELEASE">Press Release</SelectItem>
                                        <SelectItem value="STATE_OF_THE_NATION">State of the Nation</SelectItem>
                                        <SelectItem value="OTHER">Other Series</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Edition Year</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Historical data supported.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control as any}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Teskiyah Workshop 2024: Purpose of Life" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control as any}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cover Image</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FileUpload
                                        onUploadComplete={(url) => field.onChange(url)}
                                        accept="image/*"
                                        variant="secondary"
                                        label="Upload"
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="mb-2">Exact Date (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value && mounted ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date()
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control as any}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Public Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Context about this edition..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Multimedia Files</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ title: "", url: "", type: "AUDIO", order: fields.length + 1 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add File
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <Card key={field.id} className="bg-muted/50">
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control as any}
                                        name={`files.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-1">
                                                <FormLabel>File Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Part 1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name={`files.${index}.url`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Resource URL / File</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input placeholder="https://... or upload" {...field} />
                                                    </FormControl>
                                                    <FileUpload
                                                        onUploadComplete={(url, file) => {
                                                            form.setValue(`files.${index}.url`, url)
                                                            if (!form.getValues(`files.${index}.title`)) {
                                                                form.setValue(`files.${index}.title`, file.name)
                                                            }
                                                            // Auto-detect type
                                                            let type = "OTHER"
                                                            if (file.type.startsWith("audio")) type = "AUDIO"
                                                            else if (file.type.startsWith("video")) type = "VIDEO"
                                                            else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text") || file.type.includes("word") || file.type.includes("msword")) type = "DOCUMENT"

                                                            form.setValue(`files.${index}.type`, type as any)
                                                        }}
                                                        variant="secondary"
                                                        label="Upload"
                                                    />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name={`files.${index}.type`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Format</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="AUDIO">Audio</SelectItem>
                                                        <SelectItem value="VIDEO">Video Link</SelectItem>
                                                        <SelectItem value="DOCUMENT">Document</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Button type="submit" className="w-full h-12 text-lg bg-green-700 hover:bg-green-800" disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing ? "Update Archive" : "Save to Archive"}
                </Button>
            </form>
        </Form>
    )
}
