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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAsset } from "@/lib/actions/assets"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

const assetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    serialNumber: z.string().optional(),
    category: z.enum(['FURNITURE', 'ELECTRONICS', 'VEHICLE', 'PROPERTY', 'EQUIPMENT', 'OTHER']),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'LOST']),
    purchasePrice: z.coerce.number().min(0).optional(),
    currentValue: z.coerce.number().min(0).optional(),
    location: z.string().optional(),
    custodianId: z.string().optional(),
})

type AssetFormValues = z.infer<typeof assetSchema>

interface CreateAssetDialogProps {
    organizationId: string
}

export function CreateAssetDialog({ organizationId }: CreateAssetDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            name: "",
            description: "",
            category: "EQUIPMENT",
            condition: "GOOD",
            purchasePrice: 0,
            currentValue: 0,
            location: "",
        },
    })

    const { isSubmitting } = form.formState

    async function onSubmit(data: AssetFormValues) {
        try {
            const formData = {
                ...data,
                location: data.location || undefined,
                serialNumber: data.serialNumber || undefined,
                description: data.description || undefined,
                status: "ACTIVE" as const,
            }

            const result = await createAsset(formData, organizationId)

            if (result.success) {
                toast.success("Asset created successfully")
                setOpen(false)
                form.reset()
                router.refresh()
            } else {
                toast.error(result.error || "Failed to create asset")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register New Asset</DialogTitle>
                    <DialogDescription>
                        Enter details of the asset to track in the inventory.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Asset Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Dell Latitude Laptop" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FURNITURE">Furniture</SelectItem>
                                                <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                                                <SelectItem value="VEHICLE">Vehicle</SelectItem>
                                                <SelectItem value="PROPERTY">Property</SelectItem>
                                                <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Condition" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="GOOD">Good</SelectItem>
                                                <SelectItem value="FAIR">Fair</SelectItem>
                                                <SelectItem value="POOR">Poor</SelectItem>
                                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                <SelectItem value="LOST">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serialNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="S/N 12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Server Room, Office 3" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purchase Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as number | string | undefined) ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Value</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as number | string | undefined) ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about the asset..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Register Asset
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
