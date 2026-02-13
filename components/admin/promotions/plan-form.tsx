'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createPromotionPlan } from "@/lib/actions/promotions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const planSchema = z.object({
    name: z.string().min(1, "Name is required"),
    durationDays: z.coerce.number().min(1, "Duration must be at least 1 day"),
    amount: z.coerce.number().min(0, "Amount must be positive"),
    description: z.string().optional(),
})

interface PlanFormProps {
    onSuccess?: () => void
}

export function PlanForm({ onSuccess }: PlanFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: "",
            durationDays: 7,
            amount: 0,
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof planSchema>) {
        setLoading(true)
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("durationDays", values.durationDays.toString())
        formData.append("amount", values.amount.toString())
        formData.append("description", values.description || "")

        const result = await createPromotionPlan(formData)

        setLoading(false)
        if (result.success) {
            toast.success("Promotion plan created")
            form.reset()
            router.refresh()
            onSuccess?.()
        } else {
            toast.error(result.error || "Failed to create plan")
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Weekly Gold Package" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="durationDays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration (Days)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (₦)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="What does this plan include?" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Plan"}
                </Button>
            </form>
        </Form>
    )
}
