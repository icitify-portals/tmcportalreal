"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { updateOfficeCategories } from "@/lib/actions/offices"

const SPECIAL_CATEGORIES = [
    { id: 'TESKIYAH_WORKSHOP', label: 'Teskiyah Workshop' },
    { id: 'FRIDAY_KHUTHBAH', label: 'Friday Khuthbah' },
    { id: 'PRESS_RELEASE', label: 'Press Release' },
    { id: 'STATE_OF_THE_NATION', label: 'State of the Nation' },
    { id: 'OTHER', label: 'Other' },
]

export function OfficeManagement({ offices }: { offices: any[] }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [managedOffices, setManagedOffices] = useState(offices)

    const handleCategoryToggle = (officeId: string, categoryId: string) => {
        setManagedOffices(prev => prev.map(office => {
            if (office.id === officeId) {
                const categories = office.managedSpecialCategories || []
                const newCategories = categories.includes(categoryId)
                    ? categories.filter((c: string) => c !== categoryId)
                    : [...categories, categoryId]
                return { ...office, managedSpecialCategories: newCategories }
            }
            return office
        }))
    }

    const handleSave = async (officeId: string) => {
        setLoading(officeId)
        try {
            const office = managedOffices.find(o => o.id === officeId)
            const res = await updateOfficeCategories(officeId, office.managedSpecialCategories || [])
            if (res.success) {
                toast.success(`Updated permissions for ${office.name}`)
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Failed to update permissions")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            {managedOffices.map(office => (
                <Card key={office.id}>
                    <CardHeader>
                        <CardTitle>{office.name}</CardTitle>
                        <CardDescription>Configure which archive categories this office can manage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Label>Managed Special Programme Categories</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/30">
                                {SPECIAL_CATEGORIES.map(category => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`${office.id}-${category.id}`} 
                                            checked={(office.managedSpecialCategories || []).includes(category.id)}
                                            onCheckedChange={() => handleCategoryToggle(office.id, category.id)}
                                        />
                                        <Label htmlFor={`${office.id}-${category.id}`} className="cursor-pointer font-normal">
                                            {category.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <Button 
                                onClick={() => handleSave(office.id)} 
                                disabled={loading === office.id}
                            >
                                {loading === office.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {office.name}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {managedOffices.length === 0 && (
                <div className="text-center p-12 border rounded-lg bg-muted/10 text-muted-foreground">
                    No offices found for your jurisdiction.
                </div>
            )}
        </div>
    )
}
