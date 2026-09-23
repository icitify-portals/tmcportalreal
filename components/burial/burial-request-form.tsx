"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { createBurialRequest } from "@/lib/actions/burial"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


const formSchema = z.object({
    deceasedName: z.string().min(2, "Name must be at least 2 characters"),
    relationship: z.string().min(1, "Relationship is required"),
    causeOfDeath: z.string().min(1, "Cause of death is required"),
    dateOfDeath: z.string().min(1, "Date of death is required"),
    placeOfDeath: z.string().min(1, "Place of death is required"),
    contactPhone: z.string().min(10, "Phone number required"),
    contactEmail: z.string().email("Invalid email address"),
    age: z.coerce.number().min(0, "Age must be positive"),
    sex: z.enum(['MALE', 'FEMALE']),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional().nullable(),
    educationalAttainment: z.enum(['NONE', 'PRIMARY', 'SECONDARY', 'TERTIARY', 'OTHER']).optional().nullable(),
    occupation: z.string().optional().nullable(),
    stateOfOrigin: z.string().min(1, "State of Origin is required"),
    lgaOfOrigin: z.string().optional().nullable(),
    proposedBurialDate: z.string().optional().nullable(),
    burialLocation: z.string().optional().nullable(),
})

const defaultValues = {
    deceasedName: "",
    relationship: "",
    causeOfDeath: "",
    dateOfDeath: "",
    placeOfDeath: "",
    contactPhone: "",
    contactEmail: "",
    age: 0,
    sex: 'MALE' as const,
    maritalStatus: null,
    educationalAttainment: null,
    occupation: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    proposedBurialDate: '',
    burialLocation: '',
}

type BurialFormValues = z.infer<typeof formSchema>

interface BurialRequestFormProps {
    defaultFee?: number
}

export function BurialRequestForm({ defaultFee }: BurialRequestFormProps) {

    const router = useRouter()
    const form = useForm<BurialFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: defaultValues as BurialFormValues,
    })

    async function onSubmit(values: BurialFormValues) {
        try {
            
            const payload = {
                ...values,
                dateOfDeath: new Date(values.dateOfDeath),
                proposedBurialDate: values.proposedBurialDate ? new Date(values.proposedBurialDate) : null
            }

            const res = await createBurialRequest(payload)
            if (res.success) {
                toast.success("Request submitted successfully")
                router.push(`/dashboard/burial/request/${res.requestId}`)
            } else {
                toast.error(res.error || "Failed to submit request")
            }
        } catch (e) {
            toast.error("An error occurred")
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="deceasedName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name of Deceased</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="relationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relationship to Deceased</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Father, Spouse" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="dateOfDeath"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date & Time of Death</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="placeOfDeath"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Place of Death</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Hospital, Home, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="causeOfDeath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cause of Death</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief description of cause..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+234..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {defaultFee && (
                            <div className="p-4 bg-muted rounded-lg flex justify-between items-center border border-primary/20 bg-primary/5">
                                <div>
                                    <p className="font-semibold text-primary">Total Verification Fee</p>
                                    <p className="text-xs text-muted-foreground">Payable after admin approval</p>
                                </div>
                                <p className="text-2xl font-bold">₦{defaultFee.toLocaleString()}</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit">Submit Request</Button>
                        </div>

                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
