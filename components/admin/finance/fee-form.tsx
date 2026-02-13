"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createFee } from "@/lib/actions/fees"

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be positive"),
    targetType: z.enum(['ALL_MEMBERS', 'OFFICIALS']),
    dueDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>


interface FeeFormProps {
    organizationId: string
}

export function FeeForm({ organizationId }: FeeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useState(() => {
        setMounted(true)
    })

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,


        defaultValues: {
            title: "",
            description: "",
            amount: 0,
            targetType: "ALL_MEMBERS",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            const result = await createFee(values, organizationId)

            if (result.success) {
                toast.success("Fee created and assignments generated")
                router.push("/dashboard/admin/finance/fees")
                router.refresh()
            } else {
                toast.error(result.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("Failed to create fee")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control as any}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fee Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Annual Dues 2026" {...field} />
                            </FormControl>
                            <FormDescription>
                                A descriptive name for the levy.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (NGN)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="5000" {...field} />
                            </FormControl>
                            <FormDescription>
                                The minimum amount members should pay.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="targetType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target group" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ALL_MEMBERS">All Members</SelectItem>
                                    <SelectItem value="OFFICIALS">Officials Only</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Who is required to pay this fee within your jurisdiction.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Due Date (Optional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value && mounted ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Provide more context about this fee..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Fee & Assign
                </Button>
            </form>
        </Form>
    )
}
