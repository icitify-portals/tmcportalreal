"use client"

import { useState, useEffect } from "react"
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProgramme, getOffices, getOfficials, addProgrammeMaterial } from "@/lib/actions/programmes"
import { getOrganizations } from "@/lib/actions/organization"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { FileUpload as FileUploadInput } from "@/components/ui/file-upload"
import { ProgrammeMaterialsField } from "./programme-materials-field"

// Predefined tier labels for easy selection
const TIER_LABELS = [
    "National Executive",
    "State Executive",
    "LGA Executive",
    "Branch Executive",
    "Ordinary Member",
    "Non-Member",
    "Student",
    "Youth",
    "Corporate",
    "VIP",
    "Early Bird",
    "Group (5+)",
    "Custom...",
]

type PricingTierRow = { label: string; customLabel: string; amount: string }

const ProgrammeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    venue: z.string().min(1, "Venue is required"),
    organizationId: z.string().min(1, "Organization is required"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    endDate: z.string().optional(),
    time: z.string().optional(),
    targetAudience: z.enum(['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']).default('PUBLIC'),
    hasCertificate: z.boolean().default(false),
    paymentRequired: z.boolean().default(false),
    allowInstallments: z.boolean().default(false),
    minInstallmentAmount: z.string().default("0"),
    amount: z.string().default("0"),
    organizingOfficeId: z.string().optional(),
    organizingOfficialId: z.string().optional(),
    // New fields
    format: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']).default('PHYSICAL'),
    meetingUrl: z.string().optional(),
    frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY', 'CUSTOM']).default('ONCE'),
    rruleString: z.string().optional(),
    budget: z.string().default("0"),
    objectives: z.string().optional(),
    committee: z.string().optional(),
    attendanceWindow: z.string().default("3"),
    certTemplateType: z.enum(['TMC_ONLY', 'PARTNER_ONLY', 'BOTH']).default('TMC_ONLY'),
    certTmcSignature: z.string().optional(),
    certTmcSignatory: z.string().optional(),
    certPartnerName: z.string().optional(),
    certPartnerLogo: z.string().optional(),
    certPartnerSignature: z.string().optional(),
    certPartnerSignatory: z.string().optional(),
    earlyBirdAmount: z.string().optional(),
    earlyBirdDeadline: z.string().optional(),
    materials: z.array(z.object({ title: z.string(), url: z.string(), fileType: z.string() })).default([]),
    isRecurringAdmin: z.boolean().default(false),
    flyerUrl: z.string().optional(),
    pricingTiers: z.array(z.object({ label: z.string(), amount: z.string() })).default([]),
})

export function CreateProgrammeDialog({ 
    organizationId, 
    isSuperAdmin, 
    userOfficialId, 
    userOfficeId,
    userLevel,
    triggerLabel = "New Programme"
}: { 
    organizationId: string; 
    isSuperAdmin?: boolean; 
    userOfficialId?: string;
    userOfficeId?: string;
    userLevel?: string;
    triggerLabel?: string;
}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [offices, setOffices] = useState<any[]>([])
    const [officials, setOfficials] = useState<any[]>([])
    const [organizationsList, setOrganizationsList] = useState<any[]>([])

    const form = useForm({
        resolver: zodResolver(ProgrammeSchema),
        defaultValues: {
            title: "",
            description: "",
            venue: "",
            organizationId: organizationId || "",
            startDate: "",
            endDate: "",
            time: "",
            targetAudience: "PUBLIC",
            hasCertificate: false,
            paymentRequired: false,
            allowInstallments: false,
            minInstallmentAmount: "0",
            amount: "0",
            organizingOfficeId: "",
            organizingOfficialId: "",
            format: "PHYSICAL",
            meetingUrl: "",
            frequency: "ONCE",
            rruleString: "",
            budget: "0",
            objectives: "",
            committee: "",
            attendanceWindow: "3",
            certTemplateType: "TMC_ONLY",
            certTmcSignature: "",
            certTmcSignatory: "",
            certPartnerName: "",
            certPartnerLogo: "",
            certPartnerSignature: "",
            certPartnerSignatory: "",
            earlyBirdAmount: "",
            earlyBirdDeadline: "",
            materials: [],
            isRecurringAdmin: false,
            flyerUrl: "",
            pricingTiers: [],
        },
    })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const isNationalAdmin = isSuperAdmin || userLevel === 'NATIONAL'
    const selectedOrgId = form.watch("organizationId")
    const [officeSearch, setOfficeSearch] = useState("")
    const [officialSearch, setOfficialSearch] = useState("")

    // Pricing tiers local state (parallel to form field for UI purposes)
    const [tierRows, setTierRows] = useState<PricingTierRow[]>([])

    const addTierRow = () => {
        setTierRows(prev => [...prev, { label: "", customLabel: "", amount: "" }])
    }
    const removeTierRow = (idx: number) => {
        const updated = tierRows.filter((_, i) => i !== idx)
        setTierRows(updated)
        form.setValue("pricingTiers", updated.map(r => ({ label: r.label === 'Custom...' ? r.customLabel : r.label, amount: r.amount })))
    }
    const updateTierRow = (idx: number, field: keyof PricingTierRow, value: string) => {
        const updated = tierRows.map((r, i) => i === idx ? { ...r, [field]: value } : r)
        setTierRows(updated)
        form.setValue("pricingTiers", updated.map(r => ({ label: r.label === 'Custom...' ? r.customLabel : r.label, amount: r.amount })))
    }

    useEffect(() => {
        if (open && selectedOrgId) {
            getOffices(selectedOrgId).then(setOffices)
            getOfficials(selectedOrgId).then(setOfficials)
        }
    }, [open, selectedOrgId])

    useEffect(() => {
        if (open && isSuperAdmin) {
            getOrganizations().then(setOrganizationsList)
        }
    }, [open, isSuperAdmin])

    useEffect(() => {
        if (open && !isNationalAdmin) {
            if (userOfficialId) form.setValue("organizingOfficialId", userOfficialId)
            if (userOfficeId) form.setValue("organizingOfficeId", userOfficeId)
        }
    }, [open, userOfficialId, userOfficeId, isNationalAdmin])

    async function onSubmit(data: z.infer<typeof ProgrammeSchema>) {
        setIsSubmitting(true)
        try {
            const { materials, ...programmeData } = data;
            const payload: any = {
                ...programmeData,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                amount: parseFloat(data.amount || "0"),
                earlyBirdAmount: data.earlyBirdAmount ? parseFloat(data.earlyBirdAmount) : null,
                earlyBirdDeadline: data.earlyBirdDeadline ? new Date(data.earlyBirdDeadline) : null,
                allowInstallments: data.allowInstallments,
                minInstallmentAmount: parseFloat(data.minInstallmentAmount || "0"),
                budget: parseFloat(data.budget || "0"),
                attendanceWindow: parseInt(data.attendanceWindow || "3"),
                hasCertificate: data.hasCertificate,
                isRecurringAdmin: data.isRecurringAdmin,
                flyerUrl: data.flyerUrl || undefined,
                pricingTiers: data.pricingTiers && data.pricingTiers.length > 0
                    ? data.pricingTiers.reduce((acc: Record<string, number>, tier) => {
                        if (tier.label && tier.amount) acc[tier.label] = parseFloat(tier.amount) || 0;
                        return acc;
                    }, {})
                    : undefined,
            }

            const result = await createProgramme(payload, data.organizationId)

            if (result.success && result.programmeId) {
                if (materials && materials.length > 0) {
                    for (const mat of materials) {
                        await addProgrammeMaterial({
                            programmeId: result.programmeId,
                            title: mat.title,
                            url: mat.url,
                            fileType: mat.fileType
                        })
                    }
                }
                toast.success("Programme created successfully")
                setOpen(false)
                form.reset({
                    ...form.getValues(),
                    title: "",
                    description: "",
                    venue: "",
                    startDate: "",
                    endDate: "",
                    time: "",
                })
            } else {
                toast.error(result.error || "Failed to create programme")
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
                <Button disabled={!mounted} suppressHydrationWarning>
                    <Plus className="mr-2 h-4 w-4" />
                     {triggerLabel}
                </Button>
            </DialogTrigger>
            {mounted && (
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Programme</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new programme. It will proceed to approval workflow.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Programme Title"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the programme..." {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-blue-50/50">
                             <FormField
                                 control={form.control}
                                 name="isRecurringAdmin"
                                 render={({ field }) => (
                                     <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                         <FormControl>
                                             <Checkbox
                                                 checked={field.value}
                                                 onCheckedChange={field.onChange}
                                             />
                                         </FormControl>
                                         <div className="space-y-1 leading-none">
                                             <FormLabel className="text-blue-900 font-bold">
                                                 Is this a repetitive/administrative programme? (e.g., Adhkar, Teskiyyah, Meetings)
                                             </FormLabel>
                                             <FormDescription className="text-[10px]">If checked, this programme will be auto-approved immediately.</FormDescription>
                                         </div>
                                     </FormItem>
                                 )}
                             />
                         </div>

                         <FormField
                             control={form.control}
                             name="flyerUrl"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Programme Flyer / Handbill (Optional)</FormLabel>
                                     <FormControl>
                                         <FileUploadInput
                                            onUploadComplete={(url) => field.onChange(url)}
                                            accept="image/*"
                                            label={field.value ? "Change Flyer" : "Upload Flyer"}
                                         />
                                     </FormControl>
                                     {field.value && (
                                         <p className="text-xs text-green-600 font-medium truncate mt-2">Uploaded: {field.value}</p>
                                     )}
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="venue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venue</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full Address / Location" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isSuperAdmin && (
                                <FormField
                                    control={form.control}
                                    name="organizationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jurisdiction / Organization</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isSuperAdmin}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select organization" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {organizationsList.map(org => (
                                                        <SelectItem key={org.id} value={org.id}>{org.name} ({org.level})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                             <FormField
                                     control={form.control}
                                     name="pricingTiers"
                                     render={({ field }) => (
                                         <FormItem>
                             {/* Pricing Tiers — friendly row-based UI */}
             <div className="space-y-2">
                 <div className="flex items-center justify-between">
                     <div>
                         <p className="text-sm font-medium">Pricing Tiers</p>
                         <p className="text-[11px] text-muted-foreground">Set different fees per category. Leave empty to use the standard Amount.</p>
                     </div>
                     <Button type="button" variant="outline" size="sm" onClick={addTierRow} className="flex items-center gap-1 text-xs">
                         <Plus className="h-3 w-3" /> Add Tier
                     </Button>
                 </div>

                 {tierRows.length > 0 && (
                     <div className="rounded-lg border overflow-hidden">
                         <div className="grid grid-cols-[1fr_120px_36px] gap-0 bg-muted/50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                             <span>Category / Role</span>
                             <span>Amount (₦)</span>
                             <span></span>
                         </div>
                         {tierRows.map((row, idx) => (
                             <div key={idx} className="grid grid-cols-[1fr_120px_36px] gap-0 border-t items-center px-3 py-2">
                                 <div className="pr-2 space-y-1">
                                     <Select
                                         value={row.label}
                                         onValueChange={(val) => updateTierRow(idx, 'label', val)}
                                     >
                                         <SelectTrigger className="h-8 text-xs">
                                             <SelectValue placeholder="Select category..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {TIER_LABELS.map(lbl => (
                                                 <SelectItem key={lbl} value={lbl} className="text-xs">{lbl}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                     {row.label === 'Custom...' && (
                                         <Input
                                             placeholder="Enter custom category name"
                                             value={row.customLabel}
                                             onChange={(e) => updateTierRow(idx, 'customLabel', e.target.value)}
                                             className="h-7 text-xs"
                                         />
                                     )}
                                 </div>
                                 <div className="pr-2">
                                     <Input
                                         type="number"
                                         placeholder="0"
                                         min={0}
                                         value={row.amount}
                                         onChange={(e) => updateTierRow(idx, 'amount', e.target.value)}
                                         className="h-8 text-xs"
                                     />
                                 </div>
                                 <Button
                                     type="button"
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 text-destructive hover:text-destructive/80"
                                     onClick={() => removeTierRow(idx)}
                                 >
                                     <Trash2 className="h-3.5 w-3.5" />
                                 </Button>
                             </div>
                         ))}
                     </div>
                 )}

                 {tierRows.length === 0 && (
                     <div className="rounded-lg border border-dashed px-4 py-4 text-center text-xs text-muted-foreground">
                         No pricing tiers added. Click <strong>Add Tier</strong> to set category-based fees.
                     </div>
                 )}
             </div>
                                         </FormItem>
                                     )}
                                 />

                            <FormField
                                control={form.control}
                                name="organizingOfficeId"
                                render={({ field }) => {
                                    const filteredOffices = offices.filter(o => 
                                        o.name.toLowerCase().includes(officeSearch.toLowerCase())
                                    )
                                    return (
                                        <FormItem>
                                            <FormLabel>Organizing Office (Department)</FormLabel>
                                            <div className="space-y-1">
                                                {!isNationalAdmin ? (
                                                    <Input 
                                                        disabled 
                                                        value={offices.find(o => o.id === field.value)?.name || "Default Office"} 
                                                        className="bg-muted"
                                                    />
                                                ) : (
                                                    <>
                                                        <Input 
                                                            placeholder="Search office..." 
                                                            value={officeSearch}
                                                            onChange={(e) => setOfficeSearch(e.target.value)}
                                                            className="h-8 text-xs bg-white border-emerald-100"
                                                        />
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select office" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {filteredOffices.map(office => (
                                                                    <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="organizingOfficialId"
                                render={({ field }) => {
                                    const filteredOfficials = officials.filter(o => 
                                        o.name.toLowerCase().includes(officialSearch.toLowerCase()) ||
                                        o.position?.toLowerCase().includes(officialSearch.toLowerCase())
                                    )
                                    return (
                                        <FormItem>
                                            <FormLabel>Organizing Officer (Person)</FormLabel>
                                            <div className="space-y-1">
                                                {!isNationalAdmin ? (
                                                    <Input 
                                                        disabled 
                                                        value={officials.find(o => o.id === field.value)?.name || "Assigned Official"} 
                                                        className="bg-muted"
                                                    />
                                                ) : (
                                                    <>
                                                        <Input 
                                                            placeholder="Search official..." 
                                                            value={officialSearch}
                                                            onChange={(e) => setOfficialSearch(e.target.value)}
                                                            className="h-8 text-xs bg-white border-emerald-100"
                                                        />
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select official" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="none">None</SelectItem>
                                                                {filteredOfficials.map(official => (
                                                                    <SelectItem key={official.id} value={official.id}>{official.name} ({official.position})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="targetAudience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Audience</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select audience" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS'].map(aud => (
                                                    <SelectItem key={aud} value={aud}>{aud}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Format</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['PHYSICAL', 'VIRTUAL', 'HYBRID'].map(fmt => (
                                                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequency (Occurrence)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY'].map(freq => (
                                                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {(form.watch('format') === 'VIRTUAL' || form.watch('format') === 'HYBRID') && (
                            <FormField
                                control={form.control}
                                name="meetingUrl"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                                        <FormLabel>Virtual Meeting Link (e.g. Zoom/Google Meet)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://zoom.us/j/..." {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Budget (NGN)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="committee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organizing Committee</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Planning Committee" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="objectives"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Key Objectives</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What are the goals of this programme?" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g 10:00 AM" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-green-50/50">
                            <FormField
                                control={form.control}
                                name="hasCertificate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-green-900 font-bold">
                                                Issue Certificates for this Programme?
                                            </FormLabel>
                                            <FormDescription className="text-[10px]">If enabled, attended participants will be able to download certificates.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border p-4 rounded-md space-y-4">
                            <FormField
                                control={form.control}
                                name="paymentRequired"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Payment Required?</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {form.watch("paymentRequired") && (
                                <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Normal Amount (NGN)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="earlyBirdAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Early Bird Amount (NGN)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" placeholder="15000" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">Optional reduced price</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="earlyBirdDeadline"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Early Bird Deadline</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">Till 30 Sep 2026 → normal after</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowInstallments"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Allow Installments</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("allowInstallments") && (
                                        <FormField
                                            control={form.control}
                                            name="minInstallmentAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Min Installment (NGN)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" step="0.01" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                </>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="attendanceWindow"
                            render={({ field }) => (
                                <FormItem className="border border-emerald-800/40 p-4 rounded-md bg-emerald-950/20">
                                    <FormLabel className="text-emerald-100 font-bold text-xs uppercase tracking-wider">Attendance Window (Hours before start)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" max="48" placeholder="3" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormDescription className="text-[10px] text-emerald-100/60">Determine how many hours before the programme starts that scanning should be enabled.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <ProgrammeMaterialsField control={form.control} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Programme
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
            )}
        </Dialog>
    )
}

