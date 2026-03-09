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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"
import { updateMeeting } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    scheduledAt: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    venue: z.string().optional(),
    groupId: z.string().optional(),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()).default([]), // User IDs
    previousMinutesUrl: z.string().optional(),
})

interface EditMeetingDialogProps {
    meeting: any // The existing meeting object
    members: { id: string, name: string | null }[]
}

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getMeetingGroups } from "@/lib/actions/meetings"
import { useEffect } from "react"
import { Upload } from "lucide-react"

export function EditMeetingDialog({ meeting, members }: EditMeetingDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([])
    const [minutesFile, setMinutesFile] = useState<File | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open) {
            getMeetingGroups(meeting.organizationId).then(setGroups)
            setMinutesFile(null)
        }
    }, [open, meeting.organizationId])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: meeting.title || "",
            description: meeting.description || "",
            scheduledAt: "",
            time: "",
            venue: meeting.venue || "",
            groupId: meeting.groupId || "",
            meetingLink: meeting.meetingLink || "",
            isOnline: meeting.isOnline || false,
            attendees: meeting.attendees?.map((a: any) => a.user?.id).filter(Boolean) || [],
            previousMinutesUrl: ""
        },
    })

    // Reset form values once mounted to use local timezone
    useEffect(() => {
        if (mounted && meeting.scheduledAt) {
            const scheduledDate = new Date(meeting.scheduledAt)
            form.reset({
                ...form.getValues(),
                scheduledAt: format(scheduledDate, "yyyy-MM-dd"),
                time: format(scheduledDate, "HH:mm"),
            })
        }
    }, [mounted, meeting.scheduledAt, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            let minuteUrl = ""
            if (minutesFile) {
                const formData = new FormData()
                formData.append("file", minutesFile)
                formData.append("category", "minutes")
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })
                const uploadData = await uploadRes.json()
                if (uploadData.success) {
                    minuteUrl = uploadData.url
                } else {
                    toast.error("Failed to upload minutes")
                    setIsPending(false)
                    return
                }
            }

            // Combine date and time
            const date = new Date(values.scheduledAt)
            const [hours, mins] = values.time.split(':')
            date.setHours(parseInt(hours), parseInt(mins))

            const res = await updateMeeting(meeting.id, {
                ...values,
                groupId: values.groupId === "none" ? undefined : values.groupId,
                scheduledAt: date.toISOString(),
                organizationId: meeting.organizationId,
                previousMinutesUrl: minuteUrl || undefined,
            })

            if (res.success) {
                toast.success("Meeting updated and Members notified")
                setOpen(false)
                setMinutesFile(null)
            } else {
                toast.error(res.error || "Failed")
            }
        } catch (error) {
            toast.error("Error updating meeting")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Meeting
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Meeting</DialogTitle>
                    <DialogDescription>Modify meeting details. Officials and invited members will be notified.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl><Input placeholder="e.g. Monthly Exco Meeting" {...field} /></FormControl>
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="groupId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Group (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a group" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None (Officials only)</SelectItem>
                                            {groups.map(group => (
                                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormItem>
                                <FormLabel>Previous Minutes (Optional)</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setMinutesFile(e.target.files?.[0] || null)}
                                        className="cursor-pointer"
                                    />
                                    {minutesFile && <Upload className="h-4 w-4 text-green-600" />}
                                </div>
                                <FormDescription>Upload to share with all invitees</FormDescription>
                            </FormItem>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="scheduledAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="flex gap-4">
                            <FormField control={form.control} name="isOnline" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Online Meeting</FormLabel>
                                    </div>
                                </FormItem>
                            )} />
                        </div>

                        {form.watch('isOnline') ? (
                            <FormField control={form.control} name="meetingLink" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>External Meeting Link (Optional)</FormLabel>
                                    <FormControl><Input placeholder="https://zoom.us/... (Leave blank for native room)" {...field} /></FormControl>
                                    <FormDescription>Leave this blank to automatically generate a native 200-person capacity virtual room.</FormDescription>
                                </FormItem>
                            )} />
                        ) : (
                            <FormField control={form.control} name="venue" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue</FormLabel>
                                    <FormControl><Input placeholder="e.g. Conference Room" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        )}

                        <div className="space-y-2">
                            <FormLabel>Invite Members</FormLabel>
                            <ScrollArea className="h-[150px] w-full border rounded-md p-4">
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <FormField
                                            key={member.id}
                                            control={form.control}
                                            name="attendees"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={member.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(member.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), member.id])
                                                                        : field.onChange(
                                                                            (field.value || []).filter(
                                                                                (value: string) => value !== member.id
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            {member.name}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Meeting
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
