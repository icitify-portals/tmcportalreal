"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { updateMembershipSettings, MembershipSettings } from "@/lib/actions/settings"
import { toast } from "sonner"

interface SecuritySettingsFormProps {
    initialSettings: MembershipSettings
}

export function SecuritySettingsForm({ initialSettings }: SecuritySettingsFormProps) {
    const [settings, setSettings] = useState<MembershipSettings>(initialSettings)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleToggle = async (key: keyof MembershipSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        setIsUpdating(true)

        try {
            await updateMembershipSettings(newSettings)
            toast.success("Settings updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings")
            // Revert on failure
            setSettings(settings)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Access & Security
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin ml-2 text-muted-foreground" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                    <div>
                        <p className="font-medium">Public Membership Registration</p>
                        <p className="text-xs text-muted-foreground">Allow anyone to apply for membership from the home page</p>
                    </div>
                    <Switch
                        checked={settings.registrationEnabled}
                        onCheckedChange={(checked) => handleToggle("registrationEnabled", checked)}
                        disabled={isUpdating}
                    />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                    <div>
                        <p className="font-medium">Require Recommendation</p>
                        <p className="text-xs text-muted-foreground">New applications must be recommended by an official before approval</p>
                    </div>
                    <Switch
                        checked={settings.recommendationRequired}
                        onCheckedChange={(checked) => handleToggle("recommendationRequired", checked)}
                        disabled={isUpdating}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
