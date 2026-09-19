"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { recordMaintenance } from "@/lib/actions/assets"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const maintenanceSchema = z.object({
    type: z.enum(['REPAIR', 'SERVICE', 'INSPECTION', 'UPGRADE']),
    description: z.string().min(1, "Description is required"),
    cost: z.coerce.number().min(0).default(0),
    date: z.string().min(1, "Date is required"),
    performedBy: z.string().optional(),
    nextServiceDate: z.string().optional(),
})

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

interface RecordMaintenanceDialogProps {
    asset: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RecordMaintenanceDialog({ asset, open, onOpenChange }: RecordMaintenanceDialogProps) {
    const router = useRouter()

    const form = useForm<MaintenanceFormValues>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            type: "SERVICE",
            description: "",
            cost: 0,
            date: new Date().toISOString().split('T')[0],
            performedBy: "",
            nextServiceDate: "",
        },
    })

    const { isSubmitting } = form.formState

    async function onSubmit(data: MaintenanceFormValues) {
        try {
            const formData = {
                type: data.type,
                description: data.description,
                cost: data.cost,
                date: new Date(data.date),
                performedBy: data.performedBy || undefined,
                nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : undefined,
            }

            const result = await recordMaintenance(asset.id, formData)

            if (result.success) {
                toast.success("Maintenance log recorded")
                onOpenChange(false)
                form.reset()
                router.refresh()
            } else {
                toast.error(result.error || "Failed to record maintenance")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    if (!asset) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Maintenance</DialogTitle>
                    <DialogDescription>
                        Log a new service, repair, or inspection for {asset.name}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type of Maintenance</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="REPAIR">Repair</SelectItem>
                                            <SelectItem value="SERVICE">Service</SelectItem>
                                            <SelectItem value="INSPECTION">Inspection</SelectItem>
                                            <SelectItem value="UPGRADE">Upgrade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
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
                                    <FormLabel>Description / Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What was done?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="performedBy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Performed By</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Technician or company" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nextServiceDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Next Scheduled Service (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Log
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
