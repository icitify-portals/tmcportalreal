"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Bell } from "lucide-react"

interface PushNotificationDialogProps {
    children: React.ReactNode
}

export function PushNotificationDialog({ children }: PushNotificationDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [settings, setSettings] = useState({
        provider: "none",
        apiKey: "",
        appId: "",
    })

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open])

    const fetchSettings = async () => {
        try {
            setFetching(true)
            const response = await fetch("/api/settings/system?category=NOTIFICATION")
            if (response.ok) {
                const data = await response.json()
                setSettings({
                    provider: data.settings["notification.provider"] || "none",
                    apiKey: data.settings["notification.api_key"] || "",
                    appId: data.settings["notification.app_id"] || "",
                })
            }
        } catch (error) {
            toast.error("Failed to load notification settings")
        } finally {
            setFetching(false)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/settings/system", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    settings: {
                        "notification.provider": settings.provider,
                        "notification.api_key": settings.apiKey,
                        "notification.app_id": settings.appId,
                    },
                }),
            })

            if (!response.ok) throw new Error("Failed to save settings")

            toast.success("Notification settings saved successfully")
            setOpen(false)
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Push Notification Gateway
                    </DialogTitle>
                    <DialogDescription>
                        Configure push notification provider for sending alerts to mobile devices.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select value={settings.provider} onValueChange={(value) => setSettings({ ...settings, provider: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="fcm">Firebase Cloud Messaging (FCM)</SelectItem>
                                    <SelectItem value="onesignal">OneSignal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {settings.provider !== "none" && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="apiKey">API Key / Server Key</Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="Enter API key"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                    />
                                </div>

                                {settings.provider === "onesignal" && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="appId">App ID</Label>
                                        <Input
                                            id="appId"
                                            placeholder="Enter OneSignal App ID"
                                            value={settings.appId}
                                            onChange={(e) => setSettings({ ...settings, appId: e.target.value })}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || fetching}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
