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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProgramme, getOffices } from "@/lib/actions/programmes"
import { toast } from "sonner"
import { Loader2, Edit } from "lucide-react"

const ProgrammeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    venue: z.string().min(1, "Venue is required"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    endDate: z.string().optional(),
    time: z.string().optional(),
    targetAudience: z.enum(['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']).default('PUBLIC'),
    paymentRequired: z.boolean().default(false),
    amount: z.string().default("0"),
    organizingOfficeId: z.string().optional(),
})

interface EditProgrammeDialogProps {
    programme: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProgrammeDialog({ programme, open, onOpenChange }: EditProgrammeDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [offices, setOffices] = useState<any[]>([])

    useEffect(() => {
        if (open && programme.organizationId) {
            getOffices(programme.organizationId).then(setOffices)
        }
    }, [open, programme.organizationId])

    const form = useForm({
        resolver: zodResolver(ProgrammeSchema),
        defaultValues: {
            title: programme.title,
            description: programme.description || "",
            venue: programme.venue,
            startDate: new Date(programme.startDate).toISOString().split('T')[0],
            endDate: programme.endDate ? new Date(programme.endDate).toISOString().split('T')[0] : "",
            time: programme.time || "",
            targetAudience: programme.targetAudience,
            paymentRequired: programme.paymentRequired,
            amount: programme.amount?.toString() || "0",
            organizingOfficeId: programme.organizingOfficeId || "",
        },
    })

    // Reset when programme changes
    useEffect(() => {
        if (programme) {
            form.reset({
                title: programme.title,
                description: programme.description || "",
                venue: programme.venue,
                startDate: new Date(programme.startDate).toISOString().split('T')[0],
                endDate: programme.endDate ? new Date(programme.endDate).toISOString().split('T')[0] : "",
                time: programme.time || "",
                targetAudience: programme.targetAudience,
                paymentRequired: programme.paymentRequired,
                amount: programme.amount?.toString() || "0",
                organizingOfficeId: programme.organizingOfficeId || "",
            })
        }
    }, [programme, form])


    async function onSubmit(data: z.infer<typeof ProgrammeSchema>) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                amount: parseFloat(data.amount || "0"),
            }

            const result = await updateProgramme(programme.id, payload)

            if (result.success) {
                toast.success("Programme updated successfully")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to update programme")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Programme</DialogTitle>
                    <DialogDescription>
                        Update the details for this programme.
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
                                        <Input placeholder="Programme Title" {...field} value={field.value || ''} />
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

                            <FormField
                                control={form.control}
                                name="organizingOfficeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organizing Office</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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

                            <FormField
                                control={form.control}
                                name="targetAudience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Audience</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                        </div>

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
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
