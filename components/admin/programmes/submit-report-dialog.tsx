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
import { submitProgrammeReport } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { Loader2, FileText } from "lucide-react"

const ReportSchema = z.object({
    summary: z.string().min(10, "Summary is too short"),
    challenges: z.string().optional(),
    comments: z.string().optional(),
    attendeesMale: z.string().default("0"), // Input as string
    attendeesFemale: z.string().default("0"),
    amountSpent: z.string().default("0"),
})

export function SubmitReportDialog({ programmeId, programmeTitle }: { programmeId: string, programmeTitle: string }) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm({
        resolver: zodResolver(ReportSchema),
        defaultValues: {
            summary: "",
            attendeesMale: "0",
            attendeesFemale: "0",
            amountSpent: "0",
        },
    })

    async function onSubmit(data: z.infer<typeof ReportSchema>) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                attendeesMale: parseInt(data.attendeesMale),
                attendeesFemale: parseInt(data.attendeesFemale),
                amountSpent: parseFloat(data.amountSpent),
            }

            const result = await submitProgrammeReport(programmeId, payload)

            if (result.success) {
                toast.success("Report submitted successfully")
                setOpen(false)
            } else {
                toast.error("Failed to submit report")
            }
        } catch (e) {
            toast.error("Error submitting report")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Submit Report: {programmeTitle}</DialogTitle>
                    <DialogDescription>
                        Provide details about the completed programme.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Summary</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="How did it go?" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="attendeesMale"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Male Attendees</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="attendeesFemale"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Female Attendees</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="amountSpent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount Spent (NGN)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" step="0.01" {...field} value={field.value || ''} />
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
                                    <FormLabel>Challenges Encoutered</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any issues?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
