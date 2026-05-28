"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, Save, Loader2, Link as LinkIcon, Key, Lock } from "lucide-react"
import { toast } from "sonner"
import { updateLiveKitSettings, LiveKitSettings } from "@/lib/actions/settings"

export function LiveKitSettingsCard({ initialSettings }: { initialSettings: LiveKitSettings }) {
    const [settings, setSettings] = useState<LiveKitSettings>(initialSettings)
    const [isPending, startTransition] = useTransition()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSave = () => {
        startTransition(async () => {
            try {
                const res = await updateLiveKitSettings(settings) as { success: boolean, error?: string }
                if (res.success) {
                    toast.success("LiveKit Settings updated")
                } else {
                    toast.error(res.error || "Failed to update settings")
                }
            } catch (error) {
                toast.error("Failed to update settings")
            }
        })
    }

    if (!mounted) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Conferencing (LiveKit)
                </CardTitle>
                <CardDescription>Configure credentials to enable native virtual meetings for up to 200 participants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        LiveKit WebSocket URL
                    </label>
                    <Input
                        type="url"
                        placeholder="wss://your-project.livekit.cloud"
                        value={settings.url}
                        onChange={(e) => setSettings({ ...settings, url: e.target.value })}
                        className="font-mono text-xs"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        API Key
                    </label>
                    <Input
                        type="text"
                        placeholder="API Key"
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        className="font-mono text-xs"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        API Secret
                    </label>
                    <Input
                        type="password"
                        placeholder="API Secret"
                        value={settings.apiSecret}
                        onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                        className="font-mono text-xs"
                    />
                </div>
                <div className="pt-4 border-t space-y-4">
                    <h4 className="text-sm font-semibold">LiveKit S3 Storage (Recordings)</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                        Optional: Set up a dedicated S3 bucket (e.g. Wasabi or AWS) strictly for LiveKit live meeting recordings. If left blank, recordings will fallback to the general Storage Integration bucket.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">S3 Endpoint URL (Optional)</label>
                            <Input
                                type="url"
                                placeholder="e.g. s3.us-east-1.wasabisys.com"
                                value={settings.s3Endpoint}
                                onChange={(e) => setSettings({ ...settings, s3Endpoint: e.target.value })}
                                className="font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">S3 Region</label>
                            <Input
                                type="text"
                                placeholder="us-east-1"
                                value={settings.s3Region}
                                onChange={(e) => setSettings({ ...settings, s3Region: e.target.value })}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bucket Name</label>
                            <Input
                                type="text"
                                placeholder="livekit-recordings"
                                value={settings.s3Bucket}
                                onChange={(e) => setSettings({ ...settings, s3Bucket: e.target.value })}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">S3 Access Key</label>
                        <Input
                            type="text"
                            placeholder="Access Key"
                            value={settings.s3AccessKey}
                            onChange={(e) => setSettings({ ...settings, s3AccessKey: e.target.value })}
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">S3 Secret Key</label>
                        <Input
                            type="password"
                            placeholder="Secret Key"
                            value={settings.s3SecretKey}
                            onChange={(e) => setSettings({ ...settings, s3SecretKey: e.target.value })}
                            className="font-mono text-xs"
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                    You can obtain these credentials for free by creating a project on <a href="https://cloud.livekit.io/" target="_blank" className="text-blue-500 hover:underline">LiveKit Cloud</a>.
                </p>
            </CardContent>
            <CardFooter className="border-t pt-4">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Credentials
                </Button>
            </CardFooter>
        </Card>
    )
}
