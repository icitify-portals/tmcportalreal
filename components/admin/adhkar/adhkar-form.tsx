"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { locationData } from "@/lib/location-data"
import { saveAdhkarCentre } from "@/lib/actions/adhkar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"

const allStates = Object.keys(locationData)

export function AdhkarForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: "",
        venue: "",
        address: "",
        time: "",
        contactNumber: "",
        state: "",
        lga: "",
        isActive: true
    })

    const lgas = form.state ? locationData[form.state as keyof typeof locationData]?.lgas.map((l: any) => l.name) : []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.venue || !form.state || !form.lga || !form.time) {
            toast.error("Please fill all required fields")
            return
        }

        setLoading(true)
        const res = await saveAdhkarCentre(form as any)
        if (res.success) {
            toast.success("Centre saved successfully")
            router.push("/dashboard/admin/adhkar")
        } else {
            toast.error(res.error || "Failed to save")
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Centre Details</CardTitle>
                    <CardDescription>Enter the location and schedule information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Centre Name</Label>
                        <Input
                            placeholder="e.g. Alausa Secretariat Mosque"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Select
                                value={form.state}
                                onValueChange={v => setForm({ ...form, state: v, lga: "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>LGA</Label>
                            <Select
                                value={form.lga}
                                onValueChange={v => setForm({ ...form, lga: v })}
                                disabled={!form.state}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select LGA" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lgas?.map((l: string) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Venue/Landmark</Label>
                        <Input
                            placeholder="e.g. Central Mosque Hall"
                            value={form.venue}
                            onChange={e => setForm({ ...form, venue: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Full Address</Label>
                        <Textarea
                            placeholder="Complete street address..."
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Time Schedule</Label>
                            <Input
                                placeholder="e.g. Sundays 7:00 AM"
                                value={form.time}
                                onChange={e => setForm({ ...form, time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number (Optional)</Label>
                            <Input
                                placeholder="e.g. 08012345678"
                                value={form.contactNumber}
                                onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Centre
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
