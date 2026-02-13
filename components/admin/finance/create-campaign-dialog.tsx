
"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createCampaign } from "@/lib/actions/campaigns"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    targetAmount: z.string().min(1, "Target amount is required"), // Handle as string for input
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
})

type FormData = z.infer<typeof schema>

export function CreateCampaignDialog({ organizationId }: { organizationId: string }) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            // startDate set in useEffect
        }
    })

    // Set initial date on client only to prevent hydration mismatch
    useState(() => {
        setValue("startDate", new Date())
    })

    const startDate = watch("startDate")
    const endDate = watch("endDate")

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            const result = await createCampaign({
                ...data,
                targetAmount: parseFloat(data.targetAmount),
                organizationId,
                status: 'ACTIVE',
                allowCustomAmount: true
            })

            if (result.success) {
                toast.success("Campaign created successfully")
                setOpen(false)
                reset()
            } else {
                toast.error(result.error || "Failed to create campaign")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value
        setValue("title", title)
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        setValue("slug", slug)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Create Campaign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Fundraising Campaign</DialogTitle>
                    <DialogDescription>
                        Set up a new campaign to raise funds for a specific cause.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Campaign Title</Label>
                        <Input
                            id="title"
                            {...register("title")}
                            onChange={handleTitleChange}
                            placeholder="e.g. Ramadan Welfare 2025"
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input id="slug" {...register("slug")} placeholder="ramadan-welfare-2025" />
                        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetAmount">Target Amount (₦)</Label>
                        <Input
                            id="targetAmount"
                            type="number"
                            {...register("targetAmount")}
                            placeholder="1000000"
                        />
                        {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register("description")} placeholder="Describe the cause..." />
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <span suppressHydrationWarning>
                                        {startDate && mounted ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </span>
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => date && setValue("startDate", date)}
                                    disabled={(date) =>
                                        date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>End Date (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <span suppressHydrationWarning>
                                        {endDate && mounted ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </span>
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate || undefined}
                                    onSelect={(date) => setValue("endDate", date)}
                                    disabled={(date) =>
                                        date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Campaign
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
