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
import { updateMeetingGroup } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Edit, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    name: z.string().min(1, "Group name is required"),
    members: z.array(z.string()),
})

interface EditMeetingGroupDialogProps {
    group: {
        id: string
        name: string
        members: { userId: string }[]
    }
    availableMembers: { id: string, name: string | null }[]
}

export function EditMeetingGroupDialog({ group, availableMembers }: EditMeetingGroupDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: group.name,
            members: group.members.map(m => m.userId),
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const res = await updateMeetingGroup(group.id, values.name, values.members)
            if (res.success) {
                toast.success("Meeting group updated")
                setOpen(false)
            } else {
                toast.error("Failed to update group")
            }
        } catch (error) {
            toast.error("Error updating group")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Meeting Group</DialogTitle>
                    <DialogDescription>
                        Update group name and members.
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
                                Update Group
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
