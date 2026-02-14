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
import { updateYearPlannerSettings, YearPlannerSettings } from "@/lib/actions/settings"
import { toast } from "sonner"
import { CalendarIcon, Loader2, Calendar } from "lucide-react"

const YearPlannerSchema = z.object({
    programYearStart: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    programYearEnd: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    submissionDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
}).refine((data) => {
    const start = new Date(data.programYearStart)
    const end = new Date(data.programYearEnd)
    return start < end
}, {
    message: "Start date must be before end date",
    path: ["programYearEnd"],
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
            programYearStart: formatDate(initialSettings.programYearStart),
            programYearEnd: formatDate(initialSettings.programYearEnd),
            submissionDeadline: formatDate(initialSettings.submissionDeadline),
        },
    })

    async function onSubmit(data: z.infer<typeof YearPlannerSchema>) {
        setIsSubmitting(true)
        try {
            const payload: YearPlannerSettings = {
                programYearStart: new Date(data.programYearStart),
                programYearEnd: new Date(data.programYearEnd),
                submissionDeadline: new Date(data.submissionDeadline),
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
                    Configure the active programme year and submission deadlines for all jurisdictions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="programYearStart"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programme Year Start</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Beginning of the fiscal/programme year.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="programYearEnd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programme Year End</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            End of the fiscal/programme year.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="submissionDeadline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-red-500 font-bold">Global Submission Deadline</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            All jurisdictions (State, Local, Branch) must submit their programmes by this date.
                                            Submissions after this date will be flagged as LATE.
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
