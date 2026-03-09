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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createMeetingGroup } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    name: z.string().min(1, "Group name is required"),
    members: z.array(z.string()),
})

interface CreateMeetingGroupDialogProps {
    availableMembers: { id: string, name: string | null }[]
    currentOrgId: string
}

export function CreateMeetingGroupDialog({ availableMembers, currentOrgId }: CreateMeetingGroupDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            members: [],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const res = await createMeetingGroup(values.name, currentOrgId, values.members)
            if (res.success) {
                toast.success("Meeting group created")
                setOpen(false)
                form.reset()
            } else {
                toast.error("Failed to create group")
            }
        } catch (error) {
            toast.error("Error creating group")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Create Meeting Group
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Meeting Group</DialogTitle>
                    <DialogDescription>
                        Create a reusable group of attendees (e.g. "Workgroup", "Exco").
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. State Exco" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Select Members</FormLabel>
                            <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                                <div className="space-y-2">
                                    {availableMembers.map(member => (
                                        <FormField
                                            key={member.id}
                                            control={form.control}
                                            name="members"
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
                                                        <FormLabel className="font-normal cursor-pointer">
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
                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Group
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
