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
import { createMeeting } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    organizationId: z.string().min(1, "Organization is required"),
    scheduledAt: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    venue: z.string().optional(),
    groupId: z.string().optional(),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()).default([]), // User IDs
    previousMinutesUrl: z.string().optional(),
})

interface CreateMeetingDialogProps {
    members: { id: string, name: string | null }[]
    currentOrgId: string // Admin's org
    isSuperAdmin?: boolean
}

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getMeetingGroups } from "@/lib/actions/meetings"
import { getOrganizations } from "@/lib/actions/organization"
import { useEffect } from "react"
import { Upload } from "lucide-react"

export function CreateMeetingDialog({ members, currentOrgId, isSuperAdmin }: CreateMeetingDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([])
    const [organizationsList, setOrganizationsList] = useState<any[]>([])
    const [minutesFile, setMinutesFile] = useState<File | null>(null)

    useEffect(() => {
        if (open) {
            getMeetingGroups(selectedOrgId || currentOrgId).then(setGroups)
            setMinutesFile(null)
            if (isSuperAdmin) {
                getOrganizations().then(setOrganizationsList)
            }
        }
    }, [open, currentOrgId, isSuperAdmin])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            organizationId: currentOrgId || "",
            scheduledAt: "",
            time: "",
            venue: "",
            groupId: "",
            meetingLink: "",
            isOnline: false,
            attendees: [],
            previousMinutesUrl: ""
        },
    })

    const selectedOrgId = form.watch("organizationId")

    useEffect(() => {
        if (open && selectedOrgId) {
            getMeetingGroups(selectedOrgId).then(setGroups)
        }
    }, [open, selectedOrgId])

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

            const res = await createMeeting({
                ...values,
                groupId: values.groupId === "none" ? undefined : values.groupId,
                scheduledAt: date.toISOString(),
                organizationId: values.organizationId,
                previousMinutesUrl: minuteUrl || undefined,
            })

            if (res.success) {
                toast.success("Meeting scheduled and Notifications sent")
                setOpen(false)
                form.reset()
                setMinutesFile(null)
            } else {
                toast.error(res.error || "Failed")
            }
        } catch (error) {
            toast.error("Error creating meeting")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Schedule Meeting</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Schedule New Meeting</DialogTitle>
                    <DialogDescription>Create a meeting. Officials in this jurisdiction will be invited automatically.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl><Input placeholder="e.g. Monthly Exco Meeting" {...field} /></FormControl>
                            </FormItem>
                        )} />

                        {isSuperAdmin && (
                            <FormField
                                control={form.control}
                                name="organizationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jurisdiction / Organization</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select organization" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {organizationsList.map(org => (
                                                    <SelectItem key={org.id} value={org.id}>{org.name} ({org.level})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
                                Create Meeting
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
