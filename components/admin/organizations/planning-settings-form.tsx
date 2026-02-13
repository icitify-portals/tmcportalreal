"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateOrganizationPlanningSettings } from "@/lib/actions/organization"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export function PlanningSettingsForm({
    orgId,
    initialMonth,
    initialDay
}: {
    orgId: string,
    initialMonth?: number,
    initialDay?: number
}) {
    const [month, setMonth] = useState(initialMonth || 12)
    const [day, setDay] = useState(initialDay || 12)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSave() {
        setIsSaving(true)
        try {
            const res = await updateOrganizationPlanningSettings(orgId, month, day)
            if (res.success) {
                toast.success("Deadline settings updated")
            } else {
                toast.error(res.error || "Failed to update settings")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="month">Deadline Month (1-12)</Label>
                    <Input
                        id="month"
                        type="number"
                        min="1"
                        max="12"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="day">Deadline Day (1-31)</Label>
                    <Input
                        id="day"
                        type="number"
                        min="1"
                        max="31"
                        value={day}
                        onChange={(e) => setDay(parseInt(e.target.value))}
                    />
                </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Planning Settings
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
                Programmes submitted after this date for the following year will be tagged as "LATE".
            </p>
        </div>
    )
}
