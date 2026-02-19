"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createTmcProgramme, updateTmcProgramme } from "@/lib/actions/tmc-programmes"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const CATEGORIES = ["Spiritual", "Social", "Health", "Economic", "Humanitarian"]

const ICON_OPTIONS = [
    "BookOpen", "Heart", "Users", "Star", "Globe", "Shield",
    "Leaf", "Sun", "Moon", "Lightbulb", "HandHeart", "Zap",
]

type ProgrammeFormData = {
    id?: string
    title?: string
    description?: string | null
    iconName?: string | null
    category?: string | null
    order?: number | null
    isActive?: boolean | null
}

interface TmcProgrammeFormProps {
    initialData?: ProgrammeFormData
    mode: "create" | "edit"
}

export function TmcProgrammeForm({ initialData, mode }: TmcProgrammeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        iconName: initialData?.iconName ?? "",
        category: initialData?.category ?? "",
        order: initialData?.order ?? 0,
        isActive: initialData?.isActive ?? true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) { toast.error("Title is required"); return }
        setLoading(true)
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            iconName: form.iconName.trim() || undefined,
            category: form.category.trim() || undefined,
            order: Number(form.order),
            isActive: form.isActive,
        }
        const res = mode === "create"
            ? await createTmcProgramme(payload)
            : await updateTmcProgramme(initialData!.id!, payload)
        if (res.success) {
            toast.success(mode === "create" ? "Programme created" : "Programme updated")
            router.push("/dashboard/admin/tmc-programmes")
            router.refresh()
        } else {
            toast.error(res.error ?? "Something went wrong")
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Programme Details</CardTitle>
                        <CardDescription>Name and description of the programme</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Programme Title <span className="text-destructive">*</span></Label>
                            <Input id="title" placeholder="e.g. ADHKAR" value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} disabled={loading} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Full description of the programme..." value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={loading} rows={4} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Classification</CardTitle>
                        <CardDescription>Category and icon</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select id="category" value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} disabled={loading}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50">
                                <option value="">— Select category —</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="iconName">Icon Name</Label>
                            <select id="iconName" value={form.iconName}
                                onChange={e => setForm(f => ({ ...f, iconName: e.target.value }))} disabled={loading}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50">
                                <option value="">— Default icon —</option>
                                {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>Order and visibility</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input id="order" type="number" min={0} value={form.order}
                                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} disabled={loading} />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="isActive" className="text-base">Active</Label>
                                <p className="text-sm text-muted-foreground">Show on the public page</p>
                            </div>
                            <Switch id="isActive" checked={form.isActive}
                                onCheckedChange={val => setForm(f => ({ ...f, isActive: val }))} disabled={loading} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Create Programme" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin/tmc-programmes")} disabled={loading}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}
