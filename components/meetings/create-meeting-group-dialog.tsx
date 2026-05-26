"use client"

import { useState, useEffect } from "react"
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
import { createMeetingGroup, getAvailableMembers } from "@/lib/actions/meetings"
import { toast } from "sonner"
import { Loader2, Users, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FormJurisdictionSelector } from "./form-jurisdiction-selector"

const formSchema = z.object({
    name: z.string().min(1, "Group name is required"),
    organizationId: z.string().min(1, "Organization is required"),
    members: z.array(z.string()),
    dynamicRules: z.object({
        includeAllMembers: z.boolean(),
        includeOfficials: z.boolean(),
        includeChildAdmins: z.boolean(),
    }),
})

interface CreateMeetingGroupDialogProps {
    availableMembers: { id: string, name: string | null }[]
    currentOrgId: string
    isSuperAdmin?: boolean
}

export function CreateMeetingGroupDialog({ availableMembers: initialMembers, currentOrgId, isSuperAdmin }: CreateMeetingGroupDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [dynamicMembers, setDynamicMembers] = useState(initialMembers)
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)
    const [organizationsList, setOrganizationsList] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searching, setSearching] = useState(false)

    const searchUsers = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                const existingIds = new Set(dynamicMembers.map(m => m.id))
                const newMembers = data.filter((u: any) => !existingIds.has(u.id))
                setDynamicMembers(prev => [...newMembers, ...prev])
            }
        } catch (error) {
            toast.error("Failed to search users")
        } finally {
            setSearching(false)
        }
    }

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            organizationId: currentOrgId || "",
            members: [],
            dynamicRules: {
                includeAllMembers: false,
                includeOfficials: false,
                includeChildAdmins: false,
            }
        },
    })

    const selectedOrgId = form.watch("organizationId")

    useEffect(() => {
        if (open && isSuperAdmin) {
            import("@/lib/actions/organization").then(({ getOrganizations }) => {
                getOrganizations().then(setOrganizationsList)
            })
        }
    }, [open, isSuperAdmin])

    useEffect(() => {
        async function fetchMembers() {
            if (!selectedOrgId) return
            setIsLoadingMembers(true)
            try {
                const fetched = await getAvailableMembers(selectedOrgId)
                setDynamicMembers(fetched)
                // Remove selected members that are no longer in the list
                const fetchedIds = new Set(fetched.map(m => m.id))
                const currentSelected = form.getValues("members")
                const filtered = currentSelected.filter(id => fetchedIds.has(id))
                if (filtered.length !== currentSelected.length) {
                    form.setValue("members", filtered)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoadingMembers(false)
            }
        }
        fetchMembers()
    }, [selectedOrgId])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const res = await createMeetingGroup(values.name, values.organizationId, values.members, values.dynamicRules)
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
                        <ScrollArea className="max-h-[60vh] pr-4">
                            <div className="space-y-4">
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

                        {isSuperAdmin && (
                            <FormField
                                control={form.control}
                                name="organizationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meeting Jurisdiction</FormLabel>
                                        <FormControl>
                                            <FormJurisdictionSelector
                                                organizations={organizationsList}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                            <h4 className="text-sm font-semibold">Dynamic Group Rules</h4>
                            <p className="text-xs text-muted-foreground">Select automatic inclusion rules. Members matching these rules will be included in the group dynamically.</p>
                            
                            <FormField control={form.control} name="dynamicRules.includeAllMembers" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        Include all general members in this jurisdiction
                                    </FormLabel>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="dynamicRules.includeOfficials" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        Include all officials/executives in this jurisdiction
                                    </FormLabel>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="dynamicRules.includeChildAdmins" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                        Include all administrators from sub-jurisdictions (e.g. LGA admins)
                                    </FormLabel>
                                </FormItem>
                            )} />
                        </div>

                        <div className="space-y-2">
                            <FormLabel className="flex justify-between items-center mb-2">
                                <span>Specific Additional Members (Optional)</span>
                                {isLoadingMembers && <Loader2 className="h-3 w-3 animate-spin" />}
                            </FormLabel>
                            <div className="flex gap-2 mb-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email to add..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
                                    />
                                </div>
                                <Button type="button" variant="secondary" onClick={searchUsers} disabled={searching}>
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                </Button>
                            </div>
                            <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                                {dynamicMembers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No members found in this jurisdiction.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {dynamicMembers.map(member => (
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
                                )}
                            </ScrollArea>
                        </div>
                        </div>
                        </ScrollArea>

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

