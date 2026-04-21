"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, DollarSign } from "lucide-react"
import { updateFinancialSettings, FinancialSettings } from "@/lib/actions/settings"

interface FinancialSettingsCardProps {
    initialSettings: FinancialSettings
}

export function FinancialSettingsCard({ initialSettings }: FinancialSettingsCardProps) {
    const [loading, setLoading] = useState(false)
    const [fee, setFee] = useState(initialSettings.burialVerificationFee.toString())

    async function handleSave() {
        setLoading(true)
        try {
            const res = await updateFinancialSettings({
                burialVerificationFee: parseFloat(fee)
            })
            if (res.success) {
                toast.success("Financial settings updated")
            } else {
                toast.error("Failed to update settings")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Settings
                </CardTitle>
                <CardDescription>
                    Configure default fees and financial parameters.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="burialFee">Default Burial Verification Fee (₦)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="burialFee"
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            placeholder="10000"
                        />
                        <Button 
                            onClick={handleSave} 
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This is the default amount users will see during application. Admins can override this for specific requests.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
