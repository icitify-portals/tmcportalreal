"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"

interface EmailConfigDialogProps {
    children: React.ReactNode
}

export function EmailConfigDialog({ children }: EmailConfigDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [settings, setSettings] = useState({
        senderName: "",
        senderEmail: "",
        replyTo: "",
    })

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open])

    const fetchSettings = async () => {
        try {
            setFetching(true)
            const response = await fetch("/api/settings/system?category=EMAIL")
            if (response.ok) {
                const data = await response.json()
                setSettings({
                    senderName: data.settings["email.sender_name"] || "",
                    senderEmail: data.settings["email.sender_email"] || "",
                    replyTo: data.settings["email.reply_to"] || "",
                })
            }
        } catch (error) {
            toast.error("Failed to load email settings")
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
                        "email.sender_name": settings.senderName,
                        "email.sender_email": settings.senderEmail,
                        "email.reply_to": settings.replyTo,
                    },
                }),
            })

            if (!response.ok) throw new Error("Failed to save settings")

            toast.success("Email settings saved successfully")
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
                        <Mail className="h-5 w-5" />
                        Email Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure sender details for outgoing emails. The Resend API key is configured in your environment variables.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="senderName">Sender Name</Label>
                            <Input
                                id="senderName"
                                placeholder="TMC Connect"
                                value={settings.senderName}
                                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="senderEmail">Sender Email</Label>
                            <Input
                                id="senderEmail"
                                type="email"
                                placeholder="info@messages.tmcng.net"
                                value={settings.senderEmail}
                                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Must be a verified domain in your Resend account
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
                            <Input
                                id="replyTo"
                                type="email"
                                placeholder="support@tmcng.net"
                                value={settings.replyTo}
                                onChange={(e) => setSettings({ ...settings, replyTo: e.target.value })}
                            />
                        </div>
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
