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
    scheduledAt: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    venue: z.string().optional(),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()).default([]), // User IDs
})

interface CreateMeetingDialogProps {
    members: { id: string, name: string | null }[]
    currentOrgId: string // Admin's org
}

export function CreateMeetingDialog({ members, currentOrgId }: CreateMeetingDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            isOnline: false,
            attendees: []
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            // Combine date and time
            const date = new Date(values.scheduledAt)
            const [hours, mins] = values.time.split(':')
            date.setHours(parseInt(hours), parseInt(mins))

            const res = await createMeeting({
                ...values,
                scheduledAt: date.toISOString(),
                organizationId: currentOrgId,
            })

            if (res.success) {
                toast.success("Meeting scheduled")
                setOpen(false)
                form.reset()
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
                    <DialogDescription>Create a meeting and invite members.</DialogDescription>
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
                                    <FormLabel>Meeting Link</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
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
