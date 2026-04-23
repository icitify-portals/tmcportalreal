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
import { createProgramme, getOffices, getOfficials } from "@/lib/actions/programmes"
import { getOrganizations } from "@/lib/actions/organization"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

const ProgrammeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    venue: z.string().min(1, "Venue is required"),
    organizationId: z.string().min(1, "Organization is required"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    endDate: z.string().optional(),
    time: z.string().optional(),
    targetAudience: z.enum(['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']).default('PUBLIC'),
    paymentRequired: z.boolean().default(false),
    amount: z.string().default("0"),
    organizingOfficeId: z.string().optional(),
    organizingOfficialId: z.string().optional(),
    // New fields
    format: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']).default('PHYSICAL'),
    frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY']).default('ONCE'),
    budget: z.string().default("0"),
    objectives: z.string().optional(),
    committee: z.string().optional(),
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
            paymentRequired: false,
            amount: "0",
            organizingOfficeId: "",
            organizingOfficialId: "",
            format: "PHYSICAL",
            frequency: "ONCE",
            budget: "0",
            objectives: "",
            committee: "",
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
            const payload = {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                amount: parseFloat(data.amount || "0"),
                budget: parseFloat(data.budget || "0"),
                hasCertificate: false,
            }

            const result = await createProgramme(payload, data.organizationId)

            if (result.success) {
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

                        <div className="flex items-center space-x-2 border p-4 rounded-md">
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
                                            <FormLabel>
                                                Payment Required?
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {form.watch("paymentRequired") && (
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="flex-1 ml-4">
                                            <FormLabel>Amount (NGN)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" step="0.01" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

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
