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
import { createOccasionType } from "@/lib/actions/occasions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    certificateFee: z.coerce.number().min(0, "Fee must be positive"),
})

export function ManageTypesDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            certificateFee: 0,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const res = await createOccasionType(values)
            if (res.success) {
                toast.success("Occasion type created")
                setOpen(false)
                form.reset()
            } else {
                toast.error(res.error || "Failed")
            }
        } catch (error) {
            toast.error("Error creating type")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Add New Occasion Type</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Occasion Type</DialogTitle>
                    <DialogDescription>Define a new type of engagement (e.g. House Warming)</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="e.g. Nikkah" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="certificateFee" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Certificate Fee (NGN)</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={(field.value as number | string | undefined) ?? ''} /></FormControl>
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
