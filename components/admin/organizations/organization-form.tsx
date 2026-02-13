"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { createOrganization, updateOrganization } from "@/lib/actions/organization"
import { toast } from "sonner"
import { Loader2, Trash2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    level: z.enum(["NATIONAL", "STATE", "LOCAL_GOVERNMENT", "BRANCH"]),
    parentId: z.string().optional(),
    code: z.string().min(2, "Code is required (min 2 chars)"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    sliderImages: z.array(z.object({
        url: z.string(),
        caption: z.string().optional(),
    })).optional().default([]),
})

interface OrganizationFormProps {
    organizations: any[] // All orgs for parent selection
    initialData?: any // For editing
    onSuccess?: () => void
    isModal?: boolean
}

export function OrganizationForm({ organizations, initialData, onSuccess, isModal }: OrganizationFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            level: initialData?.level || "STATE",
            code: initialData?.code || "",
            parentId: initialData?.parentId || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            sliderImages: initialData?.sliderImages || [],
        },
    })

    if (!mounted) return null

    // Watch level to filter parents
    const selectedLevel = form.watch("level")

    const filteredParents = organizations.filter(org => {
        // Prevent selecting self as parent (if hierarchy loop check needed, but basic ID check is good start)
        if (initialData && org.id === initialData.id) return false;

        if (selectedLevel === "STATE") return org.level === "NATIONAL"
        if (selectedLevel === "LOCAL_GOVERNMENT") return org.level === "STATE"
        if (selectedLevel === "BRANCH") return org.level === "LOCAL_GOVERNMENT"
        return false
    })

    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File is too large. Maximum size is 2MB.")
            return
        }

        const currentCount = form.getValues("sliderImages")?.length || 0
        if (currentCount >= 5) {
            toast.error("Maximum 5 images allowed.")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("category", "organizations")
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            const data = await res.json()
            if (data.success) {
                const currentImages = form.getValues("sliderImages") || []
                form.setValue("sliderImages", [...currentImages, { url: data.url }])
                toast.success("Image uploaded")
            } else {
                toast.error("Upload failed")
            }
        } catch (err) {
            toast.error("Error uploading")
        } finally {
            setUploading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'sliderImages') {
                    formData.append(key, JSON.stringify(value))
                } else if (value) {
                    formData.append(key, value as string)
                }
            })

            let res;
            if (initialData) {
                res = await updateOrganization(initialData.id, formData)
            } else {
                res = await createOrganization(formData)
            }

            if (res.success) {
                toast.success(initialData ? "Organization updated" : "Organization created")
                if (onSuccess) {
                    onSuccess()
                    return // Stop here to avoid updating state on unmounted component
                } else if (!isModal) {
                    router.push("/dashboard/admin/organizations")
                }
                router.refresh()
            } else {
                toast.error(res.error || "Failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Alimosho LGA" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="code" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Short Code</FormLabel>
                            <FormControl><Input placeholder="e.g. ALM" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="level" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Level</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val)
                                form.setValue("parentId", "") // Reset parent when level changes
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="NATIONAL">National</SelectItem>
                                    <SelectItem value="STATE">State</SelectItem>
                                    <SelectItem value="LOCAL_GOVERNMENT">LGA</SelectItem>
                                    <SelectItem value="BRANCH">Branch</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {selectedLevel !== "NATIONAL" && (
                    <FormField control={form.control} name="parentId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Organization</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select ${selectedLevel === 'STATE' ? 'National' : selectedLevel === 'LOCAL_GOVERNMENT' ? 'State' : 'LGA'}`} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredParents.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl><Input type="email" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex flex-col gap-1">
                        <FormLabel className="text-lg font-semibold">Slider Images</FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Add up to 5 images for the homepage slider.
                            <span className="font-medium text-green-600 ml-1">Recommended: 1920x600 px (Max 2MB).</span>
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                            {form.watch("sliderImages")?.length || 0} / 5 Images
                        </div>
                        <label className={`cursor-pointer ${(form.watch("sliderImages")?.length || 0) >= 5 ? "opacity-50 pointer-events-none" : ""}`}>
                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Add Image
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading || (form.watch("sliderImages")?.length || 0) >= 5}
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {form.watch("sliderImages")?.map((img, index) => (
                            <div key={index} className="space-y-2">
                                <div className="relative aspect-video bg-muted rounded-md overflow-hidden group border">
                                    <img src={img.url} alt="Slider" className="object-cover w-full h-full" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const current = form.getValues("sliderImages")
                                            if (current) {
                                                form.setValue("sliderImages", current.filter((_, i) => i !== index))
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Image description/caption"
                                    value={img.caption || ""}
                                    onChange={(e) => {
                                        const current = [...(form.getValues("sliderImages") || [])];
                                        current[index] = { ...current[index], caption: e.target.value };
                                        form.setValue("sliderImages", current);
                                    }}
                                    className="text-xs h-8"
                                />
                            </div>
                        ))}
                        {(!form.watch("sliderImages") || form.watch("sliderImages")?.length === 0) && (
                            <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                No slider images added.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    {!isModal && <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>}
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Update Organization" : "Create Organization"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
