"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Image as ImageIcon, Music, Video, Send } from "lucide-react"
import { sendBroadcast } from "@/lib/actions/broadcasts"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    targetLevel: z.enum(['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']),
    targetId: z.string().nullable(),
    media: z.array(z.object({
        type: z.enum(['image', 'audio', 'video']),
        url: z.string()
    }))
})

type BroadcastFormValues = z.infer<typeof formSchema>;

export function BroadcastComposer({ organizations, currentUserOrg, isSuperAdmin }: { organizations: any[], currentUserOrg?: any, isSuperAdmin?: boolean }) {
    const [isPending, setIsPending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const form = useForm<BroadcastFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            content: "",
            targetLevel: (currentUserOrg?.level as any) || (isSuperAdmin ? "NATIONAL" : "NATIONAL"),
            targetId: currentUserOrg?.id || null,
            media: []
        },
    })

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("category", "broadcasts")
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            const data = await res.json()
            if (data.success) {
                const type = data.type.startsWith("image/") ? "image" : data.type.startsWith("audio/") ? "audio" : "video"
                const current = form.getValues("media") || []
                form.setValue("media", [...current, { type, url: data.url }])
                toast.success("File uploaded")
            } else {
                toast.error(data.error || "Upload failed")
            }
        } catch (err) {
            toast.error("Error uploading")
        } finally {
            setUploading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const res = await sendBroadcast(values)
            if (res.success) {
                toast.success("Broadcast sent successfully")
                form.reset()
                router.refresh()
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Failed to send broadcast")
        } finally {
            setIsPending(false)
        }
    }

    const selectedLevel = form.watch("targetLevel")

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Broadcast</CardTitle>
                <CardDescription>Reach out to members in their respective jurisdictions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl><Input placeholder="Broadcast title" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="targetLevel" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Audience Level</FormLabel>
                                    <Select onValueChange={(val) => {
                                        field.onChange(val)
                                        form.setValue("targetId", null)
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NATIONAL">National (All)</SelectItem>
                                            <SelectItem value="STATE">State Level</SelectItem>
                                            <SelectItem value="LOCAL_GOVERNMENT">LGA Level</SelectItem>
                                            <SelectItem value="BRANCH">Branch Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {selectedLevel !== "NATIONAL" && (
                                <FormField control={form.control} name="targetId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specific Organization</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {organizations
                                                    .filter(o => o.level === selectedLevel)
                                                    .map(o => (
                                                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                        </div>

                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Message Content</FormLabel>
                                <FormControl><Textarea placeholder="Type your message here..." className="min-h-[150px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="space-y-2">
                            <FormLabel>Multimedia Attachments</FormLabel>
                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/20">
                                {form.watch("media").map((m, i) => (
                                    <div key={i} className="relative group border rounded-md p-2 flex items-center gap-2 bg-background shadow-sm">
                                        {m.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                                        {m.type === 'audio' && <Music className="h-4 w-4 text-green-500" />}
                                        {m.type === 'video' && <Video className="h-4 w-4 text-red-500" />}
                                        <span className="text-[10px] font-medium truncate max-w-[80px]">{m.url.split('/').pop()}</span>
                                        <button
                                            type="button"
                                            className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            onClick={() => {
                                                const current = form.getValues("media") || []
                                                form.setValue("media", current.filter((_, idx) => idx !== i))
                                            }}
                                        >
                                            <Plus className="h-3 w-3 rotate-45" />
                                        </button>
                                    </div>
                                ))}
                                <label className="cursor-pointer">
                                    <div className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-dashed border-input bg-background hover:bg-accent h-8 px-3">
                                        {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                                        Attach Media
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,audio/*,video/*" onChange={handleUpload} disabled={uploading} />
                                </label>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Supported: Images, Audio, Video (Up to 50MB)</p>
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Broadcast
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
