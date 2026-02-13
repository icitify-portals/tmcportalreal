"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitReport } from "@/lib/actions/reports"
import { toast } from "sonner"
import { Loader2, Plus, FileText } from "lucide-react"

const ReportSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(['MONTHLY_ACTIVITY', 'QUARTERLY_STATE', 'ANNUAL_CONGRESS', 'FINANCIAL']),
    officeId: z.string().optional(),
    period: z.string().min(1, "Period is required"),
    summary: z.string().min(10, "Summary must be detailed"),
    achievements: z.string().optional(),
    challenges: z.string().optional(),
})

export function ReportSubmissionDialog({
    organizationId,
    offices
}: {
    organizationId: string,
    offices: any[]
}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm({
        resolver: zodResolver(ReportSchema),
        defaultValues: {
            title: "",
            type: "MONTHLY_ACTIVITY" as const,
            officeId: "",
            period: "", // Set in useEffect
            summary: "",
            achievements: "",
            challenges: "",
        },
    })

    // Set stable initial period on mount to avoid hydration mismatch
    useState(() => {
        const date = new Date()
        form.setValue("period", date.toISOString().slice(0, 7))
    })

    async function onSubmit(data: z.infer<typeof ReportSchema>) {
        setIsSubmitting(true)
        try {
            const payload = {
                title: data.title,
                type: data.type,
                officeId: data.officeId || undefined,
                period: data.period,
                content: {
                    summary: data.summary,
                    achievements: data.achievements,
                    challenges: data.challenges
                }
            }

            const result = await submitReport(payload, organizationId)

            if (result.success) {
                toast.success("Report submitted for approval")
                setOpen(false)
                form.reset()
            } else {
                toast.error(result.error || "Failed to submit report")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Submit Activity Report</DialogTitle>
                    <DialogDescription>
                        Fill in your activity details for the selected period.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Report Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MONTHLY_ACTIVITY">Monthly Activity</SelectItem>
                                                <SelectItem value="QUARTERLY_STATE">Quarterly State Report</SelectItem>
                                                <SelectItem value="ANNUAL_CONGRESS">Annual Congress Report</SelectItem>
                                                <SelectItem value="FINANCIAL">Financial Report</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="officeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reporting Office</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select office" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {offices.map(office => (
                                                    <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Report Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Dawah Monthly Report - Jan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Period (YYYY-MM or Year)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="2024-01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>General Summary</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe activities..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="achievements"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Key Achievements</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What was accomplished?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="challenges"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Challenges & Solutions</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any obstacles?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <FileText className="mr-2 h-4 w-4" />
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
