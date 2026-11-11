"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { updateUserRecord } from "@/lib/actions/users"
import { toast } from "sonner"
import { Loader2, Save, CheckCircle2, AlertCircle, User } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    isEmailVerified: z.boolean(),
})

interface EditUserFormProps {
    userId: string
    initialData: {
        name: string
        email: string
        phone?: string | null
        address?: string | null
        emailVerified?: Date | string | null
    }
}

export function EditUserForm({ userId, initialData }: EditUserFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData.name || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            address: initialData.address || "",
            isEmailVerified: !!initialData.emailVerified,
        },
    })

    const isVerified = form.watch("isEmailVerified")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const res = await updateUserRecord(userId, {
                name: values.name,
                email: values.email,
                phone: values.phone || "",
                address: values.address || "",
                isEmailVerified: values.isEmailVerified,
            })

            if (res.success) {
                toast.success("User profile updated successfully")
            } else {
                toast.error(res.error || "Failed to update user profile")
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Abdullah Muhammad" className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                <FormControl>
                                    <Input {...field} type="email" placeholder="user@example.com" className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="+234..." className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isEmailVerified"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs bg-muted/40">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-semibold">Email Verification</FormLabel>
                                        {field.value ? (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                                                <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertCircle className="h-3 w-3 mr-1 inline" /> Unverified
                                            </Badge>
                                        )}
                                    </div>
                                    <FormDescription className="text-xs">
                                        Unverified accounts cannot log in. Toggle on to manually verify.
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

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold">Residential Address</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Street address, city, state" className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isLoading} className="bg-green-700 hover:bg-green-800 text-white">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save User Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
