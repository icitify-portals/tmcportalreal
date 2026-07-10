"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { updateYearPlannerSettings, YearPlannerSettings } from "@/lib/actions/settings"
import { toast } from "sonner"
import { Loader2, Calendar } from "lucide-react"

const YearPlannerSchema = z.object({
    activeYear: z.number().int().min(2000).max(2100),
    nextYearOpen: z.boolean(),
    nextYearDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
})

interface YearPlannerSettingsProps {
    initialSettings: YearPlannerSettings
}

export function YearPlannerSettingsCard({ initialSettings }: YearPlannerSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper to format Date to YYYY-MM-DD for input
    const formatDate = (date: Date) => {
        try {
            return date.toISOString().split('T')[0]
        } catch (e) {
            return new Date().toISOString().split('T')[0]
        }
    }

    const form = useForm<z.infer<typeof YearPlannerSchema>>({
        resolver: zodResolver(YearPlannerSchema),
        defaultValues: {
            activeYear: initialSettings.activeYear,
            nextYearOpen: initialSettings.nextYearOpen,
            nextYearDeadline: formatDate(initialSettings.nextYearDeadline),
        },
    })

    async function onSubmit(data: z.infer<typeof YearPlannerSchema>) {
        setIsSubmitting(true)
        try {
            const payload: YearPlannerSettings = {
                activeYear: data.activeYear,
                nextYearOpen: data.nextYearOpen,
                nextYearDeadline: new Date(data.nextYearDeadline),
            }

            const result = await updateYearPlannerSettings(payload)

            if (result.success) {
                toast.success("Year Planner settings updated")
            } else {
                toast.error("Failed to update settings")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Year Planner Configuration
                </CardTitle>
                <CardDescription>
                    Manage the active programme year and configure flexible submission windows for the following year.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="activeYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Active Calendar Year</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} />
                                        </FormControl>
                                        <FormDescription>
                                            The core year for ad-hoc programmes. Programmes submitted for this year are always accepted.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="nextYearOpen"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Open Next Year Submissions
                                            </FormLabel>
                                            <FormDescription>
                                                Allow jurisdictions to submit programmes for {form.watch('activeYear') + 1}
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
                        </div>

                        <div className="pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="nextYearDeadline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-red-500 font-bold">Flexible Submission Deadline (For Next Year)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The absolute deadline for all jurisdictions to submit their programmes for {form.watch('activeYear') + 1}. 
                                            Submissions after this date will be flagged as LATE. You can extend this date at any time.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Configuration
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
