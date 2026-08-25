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
import { Loader2, Plus, FileText, Upload } from "lucide-react"
import { useEffect } from "react"

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
    offices,
    userOfficeId
}: {
    organizationId: string,
    offices: any[],
    userOfficeId?: string | null
}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

    const form = useForm({
        resolver: zodResolver(ReportSchema),
        defaultValues: {
            title: "",
            type: "MONTHLY_ACTIVITY" as const,
            officeId: userOfficeId || "",
            period: "", // Set in useEffect
            summary: "",
            achievements: "",
            challenges: "",
        },
    })

    // Set stable initial period on mount to avoid hydration mismatch
    useEffect(() => {
        if (open) {
            setAttachmentFile(null)
            const date = new Date()
            const ym = date.toISOString().slice(0, 7)
            form.setValue("period", ym)
            if (userOfficeId) form.setValue("officeId", userOfficeId)
            // Monthly office report defaults to MONTHLY_ACTIVITY at jurisdiction
            form.setValue("type", "MONTHLY_ACTIVITY")
            form.setValue("title", `${form.getValues("title") || ""}`.trim() ? form.getValues("title") : `Monthly Activity — ${ym}`)
        }
    }, [open, form, userOfficeId])

    async function onSubmit(data: z.infer<typeof ReportSchema>) {
        setIsSubmitting(true)
        try {
            let fileUrl = ""
            if (attachmentFile) {
                const formData = new FormData()
                formData.append("file", attachmentFile)
                formData.append("category", "reports")
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
                const uploadData = await uploadRes.json()
                if (uploadData.success) {
                    fileUrl = uploadData.url
                } else {
                    toast.error("Failed to upload attachment")
                    setIsSubmitting(false)
                    return
                }
            }

            const payload: any = {
                title: data.title,
                type: data.type,
                period: data.period,
                content: {
                    summary: data.summary,
                    achievements: data.achievements,
                    challenges: data.challenges,
                    ...(fileUrl && { fileUrl })
                }
            }
            if (data.officeId) {
                payload.officeId = data.officeId
            }

            const result = await submitReport(payload, organizationId)

            if (result.success) {
                toast.success("Report submitted for approval")
                setOpen(false)
                form.reset()
                setAttachmentFile(null)
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
                    <DialogTitle>Submit Monthly Office Report</DialogTitle>
                    <DialogDescription>
                        Each office presents a monthly activity report to executives at its jurisdiction. Fill in {form.watch("type") === "MONTHLY_ACTIVITY" ? "your office's activities for the selected month" : "activity details for the selected period"}.
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!userOfficeId}>
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
                                        <FormLabel>{form.watch("type") === "MONTHLY_ACTIVITY" ? "Period (Month)" : "Period (YYYY-MM or Year)"}</FormLabel>
                                        <FormControl>
                                            {form.watch("type") === "MONTHLY_ACTIVITY" ? (
                                                <Input type="month" {...field} />
                                            ) : (
                                                <Input placeholder="2024 or 2024-Q1" {...field} />
                                            )}
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

                        <div className="grid grid-cols-1 gap-4">
                            <FormItem>
                                <FormLabel>Attachment (Optional)</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.png"
                                        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                        className="cursor-pointer"
                                    />
                                    {attachmentFile && <Upload className="h-4 w-4 text-green-600" />}
                                </div>
                            </FormItem>
                        </div>

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
