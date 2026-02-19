"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createOrgan, updateOrgan } from "@/lib/actions/organs"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const CATEGORIES = [
    "Finance",
    "Humanitarian",
    "Food & Nutrition",
    "Peace & Dialogue",
    "Pilgrimage",
    "Certification",
    "Education",
    "Health",
    "Media",
    "Other",
]

type OrganFormData = {
    id?: string
    name?: string
    description?: string | null
    websiteUrl?: string | null
    logoUrl?: string | null
    category?: string | null
    order?: number | null
    isActive?: boolean | null
}

interface OrganFormProps {
    initialData?: OrganFormData
    mode: "create" | "edit"
}

export function OrganForm({ initialData, mode }: OrganFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        websiteUrl: initialData?.websiteUrl ?? "",
        logoUrl: initialData?.logoUrl ?? "",
        category: initialData?.category ?? "",
        order: initialData?.order ?? 0,
        isActive: initialData?.isActive ?? true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error("Organ name is required")
            return
        }
        setLoading(true)

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            websiteUrl: form.websiteUrl.trim() || undefined,
            logoUrl: form.logoUrl.trim() || undefined,
            category: form.category.trim() || undefined,
            order: Number(form.order),
            isActive: form.isActive,
        }

        const res = mode === "create"
            ? await createOrgan(payload)
            : await updateOrgan(initialData!.id!, payload)

        if (res.success) {
            toast.success(mode === "create" ? "Organ created successfully" : "Organ updated successfully")
            router.push("/dashboard/admin/organs")
            router.refresh()
        } else {
            toast.error(res.error ?? "Something went wrong")
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Core details about the organ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organ Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                placeholder="e.g. Al-Barakah Microfinance Bank"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of what this organ does..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                disabled={loading}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Links & Media */}
                <Card>
                    <CardHeader>
                        <CardTitle>Links & Media</CardTitle>
                        <CardDescription>Website and logo details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">Website URL</Label>
                            <Input
                                id="websiteUrl"
                                type="url"
                                placeholder="https://example.com"
                                value={form.websiteUrl}
                                onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                type="url"
                                placeholder="https://example.com/logo.png"
                                value={form.logoUrl}
                                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">Paste a direct image URL for the organ&apos;s logo</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>Category, display order, and visibility</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                disabled={loading}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                            >
                                <option value="">— Select category —</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input
                                id="order"
                                type="number"
                                min={0}
                                value={form.order}
                                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="isActive" className="text-base">Active</Label>
                                <p className="text-sm text-muted-foreground">Show this organ on the public page</p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={form.isActive}
                                onCheckedChange={val => setForm(f => ({ ...f, isActive: val }))}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Create Organ" : "Save Changes"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/admin/organs")}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}
