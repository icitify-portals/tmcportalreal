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

const formSchema = z.object({
    deceasedName: z.string().min(2, "Name must be at least 2 characters"),
    relationship: z.string().min(1, "Relationship is required"),
    causeOfDeath: z.string().min(1, "Cause of death is required"),
    dateOfDeath: z.string().min(1, "Date of death is required"), // Using string for date input
    placeOfDeath: z.string().min(1, "Place of death is required"),
    contactPhone: z.string().min(10, "Phone number required"),
    contactEmail: z.string().email("Invalid email address"),
})

export function BurialRequestForm() {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            deceasedName: "",
            relationship: "",
            causeOfDeath: "",
            dateOfDeath: "",
            placeOfDeath: "",
            contactPhone: "",
            contactEmail: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const payload = {
                ...values,
                dateOfDeath: new Date(values.dateOfDeath),
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

                        <div className="flex justify-end">
                            <Button type="submit">Submit Request</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
