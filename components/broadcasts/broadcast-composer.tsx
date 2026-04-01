import { useState, useEffect, useCallback } from "react"
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
import { Loader2, Plus, Trash2, Image as ImageIcon, Music, Video, Send, Users, User, X } from "lucide-react"
import { sendBroadcast } from "@/lib/actions/broadcasts"
import { searchUsers } from "@/lib/actions/users"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Simple debounce implementation to avoid lodash dependency
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    targetType: z.enum(['ALL', 'OFFICIALS_ONLY', 'INDIVIDUALS', 'JURISDICTION_MEMBERS']),
    targetLevel: z.enum(['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']).optional(),
    targetOfficialLevel: z.enum(['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']).optional(),
    targetId: z.string().nullable(),
    recipientIds: z.array(z.string()).optional(),
    media: z.array(z.object({
        type: z.enum(['image', 'audio', 'video']),
        url: z.string()
    }))
})

type BroadcastFormValues = z.infer<typeof formSchema>;

export function BroadcastComposer({ organizations, currentUserOrg, isSuperAdmin }: { organizations: any[], currentUserOrg?: any, isSuperAdmin?: boolean }) {
    const [isPending, setIsPending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [userSearchQuery, setUserSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<any[]>([])
    const router = useRouter()

    const form = useForm<BroadcastFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            content: "",
            targetType: "JURISDICTION_MEMBERS",
            targetLevel: (currentUserOrg?.level as any) || (isSuperAdmin ? "NATIONAL" : "NATIONAL"),
            targetOfficialLevel: undefined,
            targetId: currentUserOrg?.id || null,
            recipientIds: [],
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

    const performSearch = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSearchResults([])
                return
            }
            setSearching(true)
            try {
                const results = await searchUsers(query)
                setSearchResults(results)
            } finally {
                setSearching(false)
            }
        }, 300),
        []
    )

    useEffect(() => {
        performSearch(userSearchQuery)
    }, [userSearchQuery, performSearch])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            // Include recipient IDs from state
            const payload = {
                ...values,
                recipientIds: selectedUsers.map(u => u.id)
            }
            const res = await sendBroadcast(payload)
            if (res.success) {
                toast.success("Broadcast sent successfully")
                form.reset()
                setSelectedUsers([])
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

    const targetType = form.watch("targetType")
    const selectedLevel = form.watch("targetLevel")

    const toggleUser = (user: any) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers(prev => [...prev, user])
        }
        setUserSearchQuery("")
        setSearchResults([])
    }

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
                            <FormField control={form.control} name="targetType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Audience</FormLabel>
                                    <Select onValueChange={(val) => {
                                        field.onChange(val)
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select Target" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isSuperAdmin && <SelectItem value="ALL">All Users (National)</SelectItem>}
                                            <SelectItem value="JURISDICTION_MEMBERS">Members in Jurisdiction</SelectItem>
                                            <SelectItem value="OFFICIALS_ONLY">Officials Only</SelectItem>
                                            <SelectItem value="INDIVIDUALS">Selected Individuals</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {(targetType === 'JURISDICTION_MEMBERS' || targetType === 'OFFICIALS_ONLY') ? (
                                <FormField control={form.control} name="targetLevel" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jurisdiction Level</FormLabel>
                                        <Select onValueChange={(val) => {
                                            field.onChange(val)
                                            form.setValue("targetId", null)
                                        }} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NATIONAL">National</SelectItem>
                                                <SelectItem value="STATE">State Level</SelectItem>
                                                <SelectItem value="LOCAL_GOVERNMENT">LGA Level</SelectItem>
                                                <SelectItem value="BRANCH">Branch Level</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            ) : null}
                        </div>

                        {(targetType === 'JURISDICTION_MEMBERS' || targetType === 'OFFICIALS_ONLY') && selectedLevel !== "NATIONAL" && (
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

                        {targetType === 'OFFICIALS_ONLY' && (
                            <FormField control={form.control} name="targetOfficialLevel" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Official Level (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="All Official Levels" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NATIONAL">National Officials</SelectItem>
                                            <SelectItem value="STATE">State Officials</SelectItem>
                                            <SelectItem value="LOCAL_GOVERNMENT">LGA Officials</SelectItem>
                                            <SelectItem value="BRANCH">Branch Officials</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-[10px]">Leave empty to send to all officials in the selected jurisdiction.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {targetType === 'INDIVIDUALS' && (
                            <div className="space-y-4 pt-2 border-t mt-2">
                                <FormLabel>Select Recipients</FormLabel>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedUsers.map(user => (
                                        <Badge key={user.id} variant="secondary" className="pl-1 pr-1 py-0.5 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {user.name}
                                            <button type="button" onClick={() => toggleUser(user)} className="hover:text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                    />
                                    {searching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                                    
                                    {searchResults.length > 0 && (
                                        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg max-h-[200px] overflow-y-auto">
                                            <CardContent className="p-0">
                                                {searchResults.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center justify-between border-b last:border-0"
                                                        onClick={() => toggleUser(user)}
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}

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

import { FormDescription } from "@/components/ui/form"
