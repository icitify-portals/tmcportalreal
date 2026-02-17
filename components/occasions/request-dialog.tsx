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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { requestOccasion } from "@/lib/actions/occasions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    typeId: z.string().min(1, "Select a type"),
    organizationId: z.string().min(1, "Select an organization"), // In real app, might select from hierarchy
    date: z.string(), // Input type date
    time: z.string().min(1, "Time is required"),
    venue: z.string().min(1, "Venue is required"),
    address: z.string().min(1, "Address is required"),
    role: z.enum(['COORDINATING', 'WITNESS']),
    certificateNeeded: z.boolean().default(false),

    // Dynamic fields (simplified for now as flat connection)
    husbandName: z.string().optional(),
    wifeName: z.string().optional(),
    babyName: z.string().optional(),
    dowry: z.string().optional(),

    // Naming specific
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    dob: z.string().optional(),
})

interface RequestDialogProps {
    types: { id: string, name: string }[]
    organizations: { id: string, name: string }[] // Pass available orgs
}

export function RequestOccasionDialog({ types, organizations }: RequestDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            certificateNeeded: false,
            role: 'COORDINATING'
        },
    })

    const selectedType = types.find(t => t.id === form.watch('typeId'))?.name.toLowerCase()

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const details: any = {}
            if (selectedType?.includes('nikkah') || selectedType?.includes('wedding')) {
                details.husbandName = values.husbandName
                details.wifeName = values.wifeName
                details.dowry = values.dowry
            } else if (selectedType?.includes('naming')) {
                details.babyName = values.babyName
                details.fatherName = values.fatherName
                details.motherName = values.motherName
                details.dob = values.dob
            }

            const res = await requestOccasion({
                typeId: values.typeId,
                organizationId: values.organizationId || "default", // Validation should handle
                date: new Date(values.date),
                time: values.time,
                venue: values.venue,
                address: values.address,
                role: values.role,
                certificateNeeded: values.certificateNeeded,
                details: details
            })

            if (res.success) {
                toast.success("Request submitted successfully")
                setOpen(false)
                form.reset()
            } else {
                toast.error(res.error || "Failed to submit")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Request Occasion</DialogTitle>
                    <DialogDescription>
                        Submit a request for Nikkah, Naming Ceremony, etc.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="typeId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Occasion Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="organizationId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch/Organization</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
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

                        <FormField control={form.control} name="venue" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Venue Name</FormLabel>
                                <FormControl><Input placeholder="e.g. TMC Centre" {...field} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Required Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="COORDINATING">Coordinating (Full Service)</SelectItem>
                                        <SelectItem value="WITNESS">Witness Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="certificateNeeded" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Certificate Needed?</FormLabel>
                                    <FormDescription>Fees may apply.</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        {/* Dynamic Fields */}
                        {(selectedType?.includes('nikkah') || selectedType?.includes('marriage')) && (
                            <div className="border p-4 rounded-md space-y-4 bg-muted/50">
                                <h4 className="font-semibold">Marriage Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="husbandName" render={({ field }) => (
                                        <FormItem><FormLabel>Husband Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="wifeName" render={({ field }) => (
                                        <FormItem><FormLabel>Wife Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="dowry" render={({ field }) => (
                                        <FormItem><FormLabel>Dowry Details</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                        )}

                        {(selectedType?.includes('naming')) && (
                            <div className="border p-4 rounded-md space-y-4 bg-muted/50">
                                <h4 className="font-semibold">Naming Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="babyName" render={({ field }) => (
                                        <FormItem><FormLabel>Baby Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="dob" render={({ field }) => (
                                        <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="fatherName" render={({ field }) => (
                                        <FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="motherName" render={({ field }) => (
                                        <FormItem><FormLabel>Mother's Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                        )}


                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
