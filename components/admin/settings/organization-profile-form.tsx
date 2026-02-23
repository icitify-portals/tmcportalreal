"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Save, Loader2 } from "lucide-react"
import { updateOrganizationProfile } from "@/lib/actions/settings"
import { toast } from "sonner"

interface OrganizationProfileFormProps {
    initialData: {
        name: string | null
        email: string | null
        phone: string | null
        website: string | null
        welcomeMessage: string | null
    }
}

export function OrganizationProfileForm({ initialData }: OrganizationProfileFormProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        website: initialData.website || "",
        welcomeMessage: initialData.welcomeMessage || ""
    })

    const handleSave = async () => {
        setIsUpdating(true)
        try {
            const result = await updateOrganizationProfile(formData)
            if (result.success) {
                toast.success("Organization profile updated")
            } else {
                toast.error("Failed to update profile")
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Organization Profile
                    </CardTitle>
                    <CardDescription>This information is visible on public pages and receipts</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={isUpdating} size="sm">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Profile
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Portal Name</label>
                        <input
                            className="w-full p-2 border rounded-md"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Muslim Congress"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Support Email</label>
                        <input
                            className="w-full p-2 border rounded-md"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="support@tmcportal.org"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Contact Phone</label>
                        <input
                            className="w-full p-2 border rounded-md"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+234..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Website</label>
                        <input
                            className="w-full p-2 border rounded-md"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Welcome Message</label>
                    <textarea
                        className="w-full p-2 border rounded-md h-24"
                        value={formData.welcomeMessage}
                        onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                        placeholder="Welcome to our portal..."
                    />
                </div>
            </CardContent>
        </Card>
    )
}
