'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { requestPromotion } from "@/lib/actions/promotions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check } from "lucide-react"
import axios from "axios"
import Image from "next/image"

const requestSchema = z.object({
    planId: z.string().min(1, "Please select a plan"),
    title: z.string().min(1, "Title is required"),
    link: z.string().optional(),
    imageUrl: z.string().min(1, "Image is required"),
})

interface Plan {
    id: string
    name: string
    amount: string | number
    durationDays: number
    description: string | null
}

interface RequestFormProps {
    plans: Plan[]
}

export function PromotionRequestForm({ plans }: RequestFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm<z.infer<typeof requestSchema>>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            planId: "",
            title: "",
            link: "",
            imageUrl: "",
        },
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", "promotions")

        try {
            const res = await axios.post("/api/upload", formData)
            form.setValue("imageUrl", res.data.url)
            toast.success("Image uploaded")
        } catch (error) {
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof requestSchema>) {
        setLoading(true)
        const formData = new FormData()
        formData.append("planId", values.planId)
        formData.append("title", values.title)
        formData.append("link", values.link || "")
        formData.append("imageUrl", values.imageUrl)

        const result = await requestPromotion(formData)

        setLoading(false)
        if (result.success) {
            toast.success("Promotion requested successfully")
            router.push("/dashboard/user/promotions")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to submit request")
        }
    }

    const imageUrl = form.watch("imageUrl")

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Step 1: Select Plan */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Select a Plan</h2>
                    <FormField
                        control={form.control}
                        name="planId"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {plans.map((plan) => (
                                            <FormItem key={plan.id}>
                                                <FormControl>
                                                    <RadioGroupItem value={plan.id} className="sr-only" />
                                                </FormControl>
                                                <label
                                                    htmlFor={plan.id}
                                                    className={`
                                                        border rounded-lg p-4 cursor-pointer block hover:border-primary transition-all relative
                                                        ${field.value === plan.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card border-border"}
                                                    `}
                                                    onClick={() => field.onChange(plan.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold">{plan.name}</span>
                                                        {field.value === plan.id && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    <div className="text-2xl font-bold mb-1">
                                                        ₦{mounted ? parseFloat(plan.amount.toString()).toLocaleString() : "..."}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mb-4">
                                                        For {plan.durationDays} Days
                                                    </div>
                                                    {plan.description && (
                                                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                                            {plan.description}
                                                        </div>
                                                    )}
                                                </label>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Step 2: Ad Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">2. Advertisement Details</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title / Business Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Al-Barakah Stores" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="link"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Redirect Link (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <section className="space-y-4">
                            <FormLabel>Banner Image (Landscape)</FormLabel>
                            <div className="flex flex-col gap-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                {uploading && <div className="text-sm text-muted-foreground">Uploading...</div>}

                                {imageUrl && (
                                    <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                                        <Image
                                            src={imageUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <input type="hidden" {...form.register("imageUrl")} />
                                {form.formState.errors.imageUrl && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.imageUrl.message}
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={loading || uploading}>
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
