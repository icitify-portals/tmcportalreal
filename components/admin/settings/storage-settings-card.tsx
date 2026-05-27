"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateStorageSettings, StorageSettings } from "@/lib/actions/settings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function StorageSettingsCard({ initialSettings }: { initialSettings: StorageSettings }) {
    const [settings, setSettings] = useState<StorageSettings>(initialSettings)
    const [saving, setSaving] = useState(false)

    async function handleSave() {
        setSaving(true)
        try {
            const res = await updateStorageSettings(settings) as { success: boolean, error?: string }
            if (res.success) {
                toast.success("Storage Settings updated")
            } else {
                toast.error(res.error || "Failed to update settings")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Storage Settings (Wasabi / S3)</CardTitle>
                <CardDescription>
                    Configure S3-compatible storage for storing meeting recordings and documents. 
                    Required for LiveKit Egress recordings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>S3 Endpoint URL</Label>
                        <Input 
                            value={settings.s3Endpoint} 
                            onChange={e => setSettings({ ...settings, s3Endpoint: e.target.value })}
                            placeholder="e.g., s3.wasabisys.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>S3 Region</Label>
                        <Input 
                            value={settings.s3Region} 
                            onChange={e => setSettings({ ...settings, s3Region: e.target.value })}
                            placeholder="e.g., us-east-1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Access Key</Label>
                            <Input 
                                value={settings.s3AccessKey} 
                                onChange={e => setSettings({ ...settings, s3AccessKey: e.target.value })}
                                type="password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input 
                                value={settings.s3SecretKey} 
                                onChange={e => setSettings({ ...settings, s3SecretKey: e.target.value })}
                                type="password"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Bucket Name</Label>
                        <Input 
                            value={settings.s3Bucket} 
                            onChange={e => setSettings({ ...settings, s3Bucket: e.target.value })}
                            placeholder="e.g., tmc-recordings"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Storage Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
