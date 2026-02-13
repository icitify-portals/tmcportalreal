"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { createJurisdiction, getPotentialParents } from "../actions"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
    parentId: z.string().optional(),
})

interface AddJurisdictionDialogProps {
    level: "STATE" | "LOCAL_GOVERNMENT" | "BRANCH"
}

export function AddJurisdictionDialog({ level }: AddJurisdictionDialogProps) {
    const [open, setOpen] = useState(false)
    const [parents, setParents] = useState<{ id: string; name: string }[]>([])
    const [loadingParents, setLoadingParents] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            parentId: "", // Change undefined to empty string for controlled input
        },
    })

    // Fetch parents when dialog opens, if applicable
    useEffect(() => {
        if (open && (level === "LOCAL_GOVERNMENT" || level === "BRANCH")) {
            const parentLevel = level === "LOCAL_GOVERNMENT" ? "STATE" : "LOCAL_GOVERNMENT"
            setLoadingParents(true)
            getPotentialParents(parentLevel)
                .then((res) => {
                    if (res.success && res.data) {
                        setParents(res.data)
                    }
                })
                .finally(() => setLoadingParents(false))
        }
    }, [open, level])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await createJurisdiction({
                ...values,
                level,
                parentId: values.parentId || undefined // Convert back to undefined if empty
            })

            if (res.success) {
                toast.success(res.message)
                setOpen(false)
                form.reset()
            } else {
                toast.error(res.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("Failed to create jurisdiction")
        }
    }

    const getParentLabel = () => {
        if (level === "LOCAL_GOVERNMENT") return "State"
        if (level === "BRANCH") return "Local Government"
        return "Parent"
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {level === "LOCAL_GOVERNMENT" ? "LGA" : level === "STATE" ? "State" : "Branch"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add {level === "LOCAL_GOVERNMENT" ? "LGA" : level === "STATE" ? "State" : "Branch"}</DialogTitle>
                    <DialogDescription>
                        Create a new {level.toLowerCase().replace("_", " ")} jurisdiction.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder={level === "STATE" ? "Lagos State" : "Name"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="LAG" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {(level === "LOCAL_GOVERNMENT" || level === "BRANCH") && (
                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{getParentLabel()}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${getParentLabel()}`} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loadingParents ? (
                                                    <div className="flex items-center justify-center p-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    </div>
                                                ) : parents.length > 0 ? (
                                                    parents.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-muted-foreground">No {getParentLabel()}s found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Jurisdiction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
