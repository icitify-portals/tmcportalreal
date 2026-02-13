
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
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { saveNavigationItem } from "@/lib/actions/navigation"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    path: z.string().optional(),
    type: z.enum(["link", "dropdown", "button"]).default("link"),
    isActive: z.boolean().default(true),
    organizationId: z.string().optional(),
    parentId: z.string().optional().nullable(),
    order: z.number().default(0),
})

interface CreateMenuItemDialogProps {
    organizationId?: string
    parentId?: string | null
    trigger?: React.ReactNode
    itemToEdit?: z.infer<typeof formSchema> // pass existing item to edit
    onSuccess?: () => void
}

export function CreateMenuItemDialog({ organizationId, parentId, trigger, itemToEdit, onSuccess }: CreateMenuItemDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: itemToEdit || {
            label: "",
            path: "",
            type: "link",
            isActive: true,
            organizationId: organizationId,
            parentId: parentId || null,
            order: 0,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Ensure orgId is passed if creating new
            if (!values.organizationId && organizationId) {
                values.organizationId = organizationId
            }
            // Ensure parentId is passed
            if (parentId && !values.parentId) {
                values.parentId = parentId
            }

            const res = await saveNavigationItem(values)

            if (res.success) {
                toast.success(itemToEdit ? "Menu item updated" : "Menu item created")
                setOpen(false)
                form.reset()
                router.refresh()
                onSuccess?.()
            } else {
                toast.error(res.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const type = form.watch("type") as "link" | "dropdown" | "button"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{itemToEdit ? "Edit Menu Item" : "Create Menu Item"}</DialogTitle>
                    <DialogDescription>
                        {itemToEdit ? "Update navigation link details." : "Add a new link to the navigation menu."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Label</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. About Us" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="link">Link</SelectItem>
                                            <SelectItem value="dropdown">Dropdown (Parent)</SelectItem>
                                            <SelectItem value="button">Button (Action)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {type !== 'dropdown' && (
                            <FormField
                                control={form.control}
                                name="path"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Path / URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. /about or https://..." {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormDescription>
                                            Use relative path for internal pages (e.g. /p/about)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active</FormLabel>
                                        <FormDescription>
                                            Visible in menu
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {itemToEdit ? "Save Changes" : "Create Item"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
