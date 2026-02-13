"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bot, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateAISettings, AISettings } from "@/lib/actions/settings"

export function AiSettingsCard({ initialSettings }: { initialSettings: AISettings }) {
    const [settings, setSettings] = useState<AISettings>(initialSettings)
    const [isPending, startTransition] = useTransition()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateAISettings(settings)
                toast.success("AI Settings updated")
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
                    <Bot className="h-5 w-5" />
                    AI Configuration
                </CardTitle>
                <CardDescription>Manage the AI Member Assistant behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b">
                    <div>
                        <p className="font-medium">Enable Member Assistant</p>
                        <p className="text-xs text-muted-foreground">Show the chatbot on the dashboard</p>
                    </div>
                    <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Default AI Provider</label>
                    <Select
                        value={settings.provider}
                        onValueChange={(val: "gemini" | "deepseek") => setSettings({ ...settings, provider: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini">Google Gemini (Flash)</SelectItem>
                            <SelectItem value="deepseek">DeepSeek (V3)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Custom System Prompt</label>
                    <p className="text-xs text-muted-foreground">Override the default instructions for the AI.</p>
                    <Textarea
                        value={settings.systemPrompt}
                        onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                        placeholder="You are the AI Assistant..."
                        className="h-32 font-mono text-xs"
                    />
                </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Configuration
                </Button>
            </CardFooter>
        </Card>
    )
}
