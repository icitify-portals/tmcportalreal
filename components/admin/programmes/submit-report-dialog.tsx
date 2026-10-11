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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { submitProgrammeReport } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { Loader2, FileText, CheckCircle2, DollarSign, Users, Award, ShieldAlert } from "lucide-react"

const StandardReportSchema = z.object({
    summary: z.string().min(10, "Summary must be at least 10 characters"),
    challenges: z.string().optional(),
    comments: z.string().optional(),
    attendeesMale: z.string().default("0"),
    attendeesFemale: z.string().default("0"),
    amountSpent: z.string().default("0"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    lecturers: z.string().optional(),
    topic: z.string().optional(),
    // Standardised NADMIN Fields
    memoFrom: z.string().optional(),
    hijriDate: z.string().optional(),
    demographicsChildren: z.string().default("0"),
    demographicsYouth: z.string().default("0"),
    demographicsElders: z.string().default("0"),
    demographicsGuests: z.string().default("0"),
    kpisAchieved: z.string().optional(),
    resolutionsText: z.string().optional(),
    budgetApproved: z.string().default("0"),
    actualIncome: z.string().default("0"),
    recommendations: z.string().optional(),
})

export function SubmitReportDialog({ programmeId, programmeTitle }: { programmeId: string, programmeTitle: string }) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    const form = useForm<z.infer<typeof StandardReportSchema>>({
        resolver: zodResolver(StandardReportSchema) as any,
        defaultValues: {
            summary: "",
            attendeesMale: "0",
            attendeesFemale: "0",
            amountSpent: "0",
            startTime: "",
            endTime: "",
            lecturers: "",
            topic: "",
            challenges: "",
            comments: "",
            memoFrom: "Office of the Organizing Secretary",
            hijriDate: "",
            demographicsChildren: "0",
            demographicsYouth: "0",
            demographicsElders: "0",
            demographicsGuests: "0",
            kpisAchieved: "",
            resolutionsText: "",
            budgetApproved: "0",
            actualIncome: "0",
            recommendations: "",
        },
    })

    const maleCount = parseInt(form.watch("attendeesMale") || "0") || 0
    const femaleCount = parseInt(form.watch("attendeesFemale") || "0") || 0
    const childrenCount = parseInt(form.watch("demographicsChildren") || "0") || 0
    const youthCount = parseInt(form.watch("demographicsYouth") || "0") || 0
    const eldersCount = parseInt(form.watch("demographicsElders") || "0") || 0
    const guestsCount = parseInt(form.watch("demographicsGuests") || "0") || 0
    const totalAttendance = maleCount + femaleCount + childrenCount + guestsCount

    const budgetApproved = parseFloat(form.watch("budgetApproved") || "0") || 0
    const amountSpent = parseFloat(form.watch("amountSpent") || "0") || 0
    const actualIncome = parseFloat(form.watch("actualIncome") || "0") || 0
    const netVariance = actualIncome - amountSpent

    async function onSubmit(data: z.infer<typeof StandardReportSchema>) {
        setIsSubmitting(true)
        try {
            const payload = {
                summary: data.summary,
                challenges: data.challenges || "",
                comments: data.comments || "",
                attendeesMale: parseInt(data.attendeesMale || "0") || 0,
                attendeesFemale: parseInt(data.attendeesFemale || "0") || 0,
                amountSpent: parseFloat(data.amountSpent || "0") || 0,
                startTime: data.startTime || "",
                endTime: data.endTime || "",
                lecturers: data.lecturers || "",
                topic: data.topic || "",
                // Structured NADMIN Extension Metadata (Backward compatible, zero data loss)
                metadata: {
                    standardFormat: "NADMIN_STANDARD_V2",
                    memoRouting: {
                        from: data.memoFrom || "Organizing Officer",
                        hijriDate: data.hijriDate || "",
                        submittedAt: new Date().toISOString(),
                    },
                    demographicsBreakdown: {
                        maleAdults: maleCount,
                        femaleAdults: femaleCount,
                        children: childrenCount,
                        youth: youthCount,
                        elders: eldersCount,
                        guests: guestsCount,
                        totalAudience: totalAttendance,
                    },
                    kpisAndOutcomes: data.kpisAchieved || "",
                    resolutionsAndActionItems: data.resolutionsText || "",
                    financialStatement: {
                        approvedBudget: budgetApproved,
                        totalIncome: actualIncome,
                        totalExpenditure: amountSpent,
                        netVariance: netVariance,
                    },
                    recommendationsToSecretariat: data.recommendations || "",
                }
            }

            const result = await submitProgrammeReport(programmeId, payload)

            if (result.success) {
                toast.success("Standardised NADMIN Report submitted successfully!")
                setOpen(false)
            } else {
                toast.error(result.error || "Failed to submit report")
            }
        } catch (e: any) {
            toast.error(e.message || "Error submitting report")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                        <Award className="h-4 w-4" />
                        Standardised NADMIN Programme Report
                    </div>
                    <DialogTitle className="text-xl">Report: {programmeTitle}</DialogTitle>
                    <DialogDescription>
                        Complete this formal performance and evaluation report as standardised by the National Administration (NADMIN).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-4 bg-muted/60 p-1">
                                <TabsTrigger value="overview" className="text-xs">
                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                    1. Memo & Preamble
                                </TabsTrigger>
                                <TabsTrigger value="attendance" className="text-xs">
                                    <Users className="h-3.5 w-3.5 mr-1" />
                                    2. Demographics
                                </TabsTrigger>
                                <TabsTrigger value="activities" className="text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    3. KPIs & Actions
                                </TabsTrigger>
                                <TabsTrigger value="financials" className="text-xs">
                                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                                    4. Financials & Recs
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: Memo & Overview */}
                            <TabsContent value="overview" className="space-y-4 pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                                    <FormField
                                        control={form.control}
                                        name="memoFrom"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Originating Office / Officer</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. NADMIN / State Admin / Organising Secretary" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hijriDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Hijri Date (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 26th Rabi'ul Awwal 1448" {...field} />
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
                                            <FormLabel className="font-semibold">Executive Summary & Preamble</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={4} 
                                                    placeholder="Comprehensive overview of the execution, major highlights, and proceedings..." 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="topic"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Theme / Topic of Discussion</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Main theme or key lecture topics" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lecturers"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Facilitators / Guest Speakers</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Names and titles of speakers" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Commencement Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Closing Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* TAB 2: Attendance & Demographics */}
                            <TabsContent value="attendance" className="space-y-4 pt-3">
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                                    <div className="text-xs text-emerald-900 font-medium">
                                        Total Standardised Attendance Count
                                    </div>
                                    <div className="text-xl font-bold text-emerald-800">
                                        {totalAttendance.toLocaleString()} Delegates
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="attendeesMale"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Adult Brothers (Male)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
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
                                                <FormLabel className="text-xs font-semibold">Adult Sisters (Female)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="demographicsYouth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Youth / Students</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="demographicsChildren"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Children</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="demographicsElders"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Elders / Senior Cadres</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="demographicsGuests"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Guests & Dignitaries</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* TAB 3: KPIs & Action Items */}
                            <TabsContent value="activities" className="space-y-4 pt-3">
                                <FormField
                                    control={form.control}
                                    name="kpisAchieved"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-xs">
                                                Key Performance Indicators (KPIs) & Milestones Achieved
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={4} 
                                                    placeholder="e.g.&#10;• New branches established: 2&#10;• Delegates trained in Digital Tools: 140&#10;• Literature distributed: 300 copies" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="resolutionsText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-xs">
                                                Meeting Resolutions, Communiqué & Action Items
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={4} 
                                                    placeholder="e.g.&#10;• Resolution 1: Set up Zonal monitoring team by 15th next month (Officer: Brother Yusuf)&#10;• Resolution 2: Collate feedback on welfare distribution" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* TAB 4: Financials & Recommendations */}
                            <TabsContent value="financials" className="space-y-4 pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="budgetApproved"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Approved Budget (₦)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="actualIncome"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Total Revenue / Raised (₦)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="amountSpent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Actual Expenses (₦)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-700">Financial Net Balance / Variance:</span>
                                    <span className={`font-bold ${netVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        ₦{netVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="challenges"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold flex items-center gap-1.5 text-amber-800">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Challenges Encountered & Bottlenecks
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Logistical delays, venue issues, electricity, sound..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="recommendations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-emerald-800">
                                                Recommendations & Executive Requests to the Secretariat
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Specific policy interventions, requests for next cycle..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Standardised NADMIN Report
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
