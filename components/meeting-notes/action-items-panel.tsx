"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CheckSquare, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createMeetingActionItem, updateMeetingActionItemStatus } from "@/lib/actions/meeting-action-items"

type ActionItem = {
    id: string
    title: string
    description: string | null
    dueDate: Date | string | null
    status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | null
    assignee?: { name: string | null } | null
}

type MeetingAttendee = {
    id: string
    name: string | null
    email: string | null
}

export function ActionItemsPanel({ meetingId, initialItems, attendees }: { meetingId: string; initialItems: ActionItem[]; attendees: MeetingAttendee[] }) {
    const [items, setItems] = useState(initialItems)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [assignedTo, setAssignedTo] = useState("unassigned")
    const [isPending, startTransition] = useTransition()

    function addItem() {
        if (!title.trim()) return
        startTransition(async () => {
            const result = await createMeetingActionItem({
                meetingId,
                title,
                description: description || null,
                dueDate: dueDate || null,
                assignedTo: assignedTo === "unassigned" ? null : assignedTo,
            })
            if (!result.success || !result.id) {
                toast.error(result.error || "Could not create action item")
                return
            }
            setItems((current) => [{
                id: result.id,
                title: title.trim(),
                description: description || null,
                dueDate: dueDate || null,
                status: "OPEN",
                assignee: null,
            }, ...current])
            setTitle("")
            setDescription("")
            setDueDate("")
            setAssignedTo("unassigned")
            toast.success("Action item added")
        })
    }

    function updateStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "COMPLETED") {
        startTransition(async () => {
            const result = await updateMeetingActionItemStatus(id, status)
            if (!result.success) {
                toast.error(result.error || "Could not update action item")
                return
            }
            setItems((current) => current.map((item) => item.id === id ? {
                ...item,
                status,
            } : item))
        })
    }

    return (
        <div className="border-b bg-amber-50/60 p-3">
            <div className="mx-auto flex max-w-5xl flex-col gap-3">
                <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-amber-700" />
                    <h3 className="text-sm font-semibold">Action items</h3>
                    <Badge variant="outline" className="ml-1">{items.length}</Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_180px_220px_auto]">
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to happen?" />
                    <Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Due date" />
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Assign to" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {attendees.map((attendee) => <SelectItem key={attendee.id} value={attendee.id}>{attendee.name || attendee.email || "Member"}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={addItem} disabled={isPending || !title.trim()}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Add item
                    </Button>
                </div>
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional context or expected outcome" className="min-h-16 bg-white" />

                {items.length > 0 && (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-md border bg-white p-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className={`font-medium ${item.status === "COMPLETED" ? "text-muted-foreground line-through" : ""}`}>{item.title}</p>
                                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        {item.dueDate ? `Due ${new Date(item.dueDate).toLocaleString()}` : "No due date"}
                                        {item.assignee?.name ? ` · ${item.assignee.name}` : " · Unassigned"}
                                    </p>
                                </div>
                                <Select value={item.status || "OPEN"} onValueChange={(value) => updateStatus(item.id, value as "OPEN" | "IN_PROGRESS" | "COMPLETED")}>
                                    <SelectTrigger className="w-full bg-white md:w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
