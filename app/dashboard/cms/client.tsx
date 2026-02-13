"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save, Upload, LayoutTemplate, FileText } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import axios from "axios"
import Image from "next/image"

const cmsSchema = z.object({
    welcomeMessage: z.string().optional(),
    welcomeImageUrl: z.string().optional(),
    missionText: z.string().optional(),
    visionText: z.string().optional(),
    whatsapp: z.string().optional(),
    officeHours: z.string().optional(),
    googleMapUrl: z.string().optional(),
    sliderImages: z.array(z.object({
        url: z.string().optional(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
    })).optional(),
})

type CMSFormValues = z.infer<typeof cmsSchema>

export default function CMSClientPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [isUploading, setIsUploading] = useState(false)

    const form = useForm<CMSFormValues>({
        resolver: zodResolver(cmsSchema),
        defaultValues: {
            welcomeMessage: "",
            welcomeImageUrl: "",
            missionText: "",
            visionText: "",
            whatsapp: "",
            officeHours: "",
            googleMapUrl: "",
            sliderImages: [],
        },
    })

    // Fetch Organization Details
    useEffect(() => {
        const fetchOrgDetails = async () => {
            try {
                const response = await fetch("/api/organization/cms")
                if (response.ok) {
                    const data = await response.json()
                    let sliderImages = data.sliderImages;
                    if (typeof sliderImages === 'string') {
                        try {
                            sliderImages = JSON.parse(sliderImages);
                        } catch (e) {
                            sliderImages = [];
                        }
                    }
                    form.reset({
                        welcomeMessage: data.welcomeMessage || "",
                        welcomeImageUrl: data.welcomeImageUrl || "",
                        missionText: data.missionText || "",
                        visionText: data.visionText || "",
                        whatsapp: data.whatsapp || "",
                        officeHours: data.officeHours || "",
                        googleMapUrl: data.googleMapUrl || "",
                        sliderImages: Array.isArray(sliderImages) ? sliderImages : [],
                    })
                }
            } catch (error) {
                toast.error("Failed to load organization details")
            } finally {
                setIsFetching(false)
            }
        }

        fetchOrgDetails()
    }, [form])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", "cms")

        try {
            const res = await axios.post("/api/upload", formData)
            form.setValue("welcomeImageUrl", res.data.url, { shouldValidate: true })
            toast.success("Image uploaded successfully")
        } catch (error) {
            toast.error("Failed to upload image")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", "cms/slider")

        try {
            const res = await axios.post("/api/upload", formData)
            form.setValue(`sliderImages.${index}.url`, res.data.url, { shouldValidate: true })
            toast.success("Slider image uploaded successfully")
        } catch (error) {
            toast.error("Failed to upload slider image")
        } finally {
            setIsUploading(false)
        }
    }

    const onSubmit = async (data: CMSFormValues) => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/organization/cms", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error("Failed to update CMS content")

            toast.success("Content updated successfully")
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    // Helper to manage slider images
    const sliderImages = form.watch("sliderImages") || []
    const addSliderImage = () => {
        const current = form.getValues("sliderImages") || []
        form.setValue("sliderImages", [...current, { url: "", title: "", subtitle: "" }])
    }
    const removeSliderImage = (index: number) => {
        const current = form.getValues("sliderImages") || []
        form.setValue("sliderImages", current.filter((_, i) => i !== index))
    }

    if (isFetching) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Tabs defaultValue="general" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="mission">Mission & Vision</TabsTrigger>
                                <TabsTrigger value="slider">Homepage Slider</TabsTrigger>
                                <TabsTrigger value="contact">Contact & Location</TabsTrigger>
                                <TabsTrigger value="quick-links">Quick Links</TabsTrigger>
                            </TabsList>

                            <TabsContent value="quick-links" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push("/dashboard/admin/cms/menus")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <LayoutTemplate className="h-5 w-5" />
                                                Menu Management
                                            </CardTitle>
                                            <CardDescription>
                                                Manage navigation links and dropdown menus for your jurisdiction's public site.
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push("/dashboard/admin/cms/pages")}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Dynamic Pages
                                            </CardTitle>
                                            <CardDescription>
                                                Create and edit custom content pages (e.g., About Us, Activities) for your public site.
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="general" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Welcome Section</CardTitle>
                                        <CardDescription>Manage the welcome message and image.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="welcomeMessage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Welcome Message</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="welcomeImageUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Welcome Image</FormLabel>
                                                    <div className="space-y-4">
                                                        <FormControl>
                                                            <div className="flex items-center gap-4">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleImageUpload}
                                                                    disabled={isUploading}
                                                                    className="hidden"
                                                                    id="welcome-image-upload"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => document.getElementById('welcome-image-upload')?.click()}
                                                                    disabled={isUploading}
                                                                >
                                                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                                                    Upload Image
                                                                </Button>
                                                                <Input
                                                                    placeholder="Or enter image URL..."
                                                                    {...field}
                                                                    className="flex-1"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        {field.value && (
                                                            <div className="relative aspect-video w-full max-w-md rounded-md overflow-hidden border bg-muted">
                                                                <Image
                                                                    src={field.value}
                                                                    alt="Welcome preview"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2"
                                                                    onClick={() => field.onChange("")}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <FormDescription>Upload or link to an image for the welcome section.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="mission" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Mission & Vision</CardTitle>
                                        <CardDescription>Define your organization's core values.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="missionText"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Our Mission</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="visionText"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Our Vision</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="slider" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Slider Images</CardTitle>
                                        <CardDescription>Manage the images displayed on the homepage slider.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {sliderImages.map((_, index) => (
                                            <div key={index} className="flex gap-4 items-start border p-4 rounded-md">
                                                <div className="grid gap-2 flex-1">
                                                    <FormField
                                                        control={form.control}
                                                        name={`sliderImages.${index}.url`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Image</FormLabel>
                                                                <FormControl>
                                                                    <div className="space-y-2">
                                                                        <div className="flex gap-2">
                                                                            <Input placeholder="https://..." {...field} className="flex-1" />
                                                                            <Input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleSliderImageUpload(e, index)}
                                                                                disabled={isUploading}
                                                                                className="hidden"
                                                                                id={`slider-upload-${index}`}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                onClick={() => document.getElementById(`slider-upload-${index}`)?.click()}
                                                                                disabled={isUploading}
                                                                            >
                                                                                <Upload className="h-4 w-4 mr-2" /> Upload
                                                                            </Button>
                                                                        </div>
                                                                        {field.value && (
                                                                            <div className="relative aspect-[3/1] w-full rounded-md overflow-hidden border bg-muted">
                                                                                <Image
                                                                                    src={field.value}
                                                                                    alt="Slider preview"
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`sliderImages.${index}.title`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Title (Optional)</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Slide Title" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`sliderImages.${index}.subtitle`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Subtitle (Optional)</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Slide Subtitle" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <Button type="button" variant="destructive" size="icon" onClick={() => removeSliderImage(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={addSliderImage} className="w-full">
                                            <Plus className="mr-2 h-4 w-4" /> Add Slide
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contact Details</CardTitle>
                                        <CardDescription>Update your contact information.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="whatsapp"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>WhatsApp Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+234..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="officeHours"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Office Hours</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Mon-Fri, 9am-5pm" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="googleMapUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Google Map Embed URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://www.google.com/maps/embed?..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Copy the embed URL from Google Maps.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </div>
        </DashboardLayout>
    )
}
