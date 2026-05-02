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
import { Loader2, Plus } from "lucide-react"
import { FileUpload as FileUploadInput } from "@/components/ui/file-upload"
import { ProgrammeMaterialsField } from "./programme-materials-field"

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
    frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY']).default('ONCE'),
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
    materials: z.array(z.object({ title: z.string(), url: z.string(), fileType: z.string() })).default([]),
})

export function CreateProgrammeDialog({ organizationId, isSuperAdmin }: { organizationId: string; isSuperAdmin?: boolean }) {
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
            materials: [],
        },
    })

    const selectedOrgId = form.watch("organizationId")

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

    async function onSubmit(data: z.infer<typeof ProgrammeSchema>) {
        setIsSubmitting(true)
        try {
            const { materials, ...programmeData } = data;
            const payload = {
                ...programmeData,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                amount: parseFloat(data.amount || "0"),
                allowInstallments: data.allowInstallments,
                minInstallmentAmount: parseFloat(data.minInstallmentAmount || "0"),
                budget: parseFloat(data.budget || "0"),
                attendanceWindow: parseInt(data.attendanceWindow || "3"),
                hasCertificate: false,
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Programme
                </Button>
            </DialogTrigger>
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
                                        <input
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                name="organizingOfficeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organizing Office (Department)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select office" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {offices.map(office => (
                                                    <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="organizingOfficialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organizing Officer (Person)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select official" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {officials.map(official => (
                                                    <SelectItem key={official.id} value={official.id}>{official.name} ({official.position})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount (NGN)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" {...field} value={field.value || ''} />
                                                </FormControl>
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

                        <div className="space-y-4 border border-emerald-800/40 p-4 rounded-md bg-emerald-950/20">
                            <h3 className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Certificate Settings & Branding
                            </h3>
                            <p className="text-xs text-emerald-200/80">Configure how the certificates of participation should look.</p>
                            
                            <FormField
                                control={form.control}
                                name="certTemplateType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-emerald-100">Certificate Template</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-emerald-800/40 bg-emerald-950/20 text-emerald-100">
                                                    <SelectValue placeholder="Select template type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="border-emerald-800/40 bg-emerald-950 text-emerald-100">
                                                <SelectItem value="TMC_ONLY">TMC Only (Standard)</SelectItem>
                                                <SelectItem value="PARTNER_ONLY">Partner Only (Hosted)</SelectItem>
                                                <SelectItem value="BOTH">Partnership (TMC & Partner)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(form.watch("certTemplateType") === 'TMC_ONLY' || form.watch("certTemplateType") === 'BOTH') && (
                                <div className="p-3 border border-emerald-800/40 rounded-md bg-emerald-950/30 space-y-4">
                                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">TMC Branding</h4>
                                    <FormField
                                        control={form.control}
                                        name="certTmcSignatory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-emerald-100">TMC Signatory Name/Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. National Amir" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="certTmcSignature"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-emerald-100">TMC Signature</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input {...field} placeholder="Signature URL" value={field.value || ''} />
                                                    </FormControl>
                                                    <FileUploadInput 
                                                        onUploadComplete={(url) => field.onChange(url)} 
                                                        label="Upload"
                                                        accept="image/*"
                                                    />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {(form.watch("certTemplateType") === 'PARTNER_ONLY' || form.watch("certTemplateType") === 'BOTH') && (
                                <div className="p-3 border border-emerald-800/40 rounded-md bg-emerald-950/30 space-y-4">
                                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Partner Branding</h4>
                                    <FormField
                                        control={form.control}
                                        name="certPartnerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-emerald-100">Partner Organization Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Al-Hikmah University" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="certPartnerSignatory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-emerald-100">Partner Signatory Name/Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Vice Chancellor" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="certPartnerLogo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-emerald-100">Partner Logo</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input {...field} placeholder="Logo URL" value={field.value || ''} />
                                                        </FormControl>
                                                        <FileUploadInput 
                                                            onUploadComplete={(url) => field.onChange(url)} 
                                                            label="Upload"
                                                            accept="image/*"
                                                        />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="certPartnerSignature"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-emerald-100">Partner Signature</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input {...field} placeholder="Signature URL" value={field.value || ''} />
                                                        </FormControl>
                                                        <FileUploadInput 
                                                            onUploadComplete={(url) => field.onChange(url)} 
                                                            label="Upload"
                                                            accept="image/*"
                                                        />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

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
        </Dialog>
    )
}

