"use client"

import { Button } from "@/components/ui/button"
import { seedYearPlanner } from "@/lib/seed-planner"
import { toast } from "sonner"
import { useState } from "react"
import { Database } from "lucide-react"

export function SeedPlannerButton() {
    const [loading, setLoading] = useState(false)

    async function handleSeed() {
        setLoading(true)
        try {
            const res = await seedYearPlanner()
            if (res?.success) {
                toast.success(`Seeded ${res.count} programmes`)
            } else {
                toast.error("Failed to seed")
            }
        } catch (e) {
            toast.error("Error seeding")
        }
        setLoading(false)
    }

    return (
        <Button variant="secondary" onClick={handleSeed} disabled={loading}>
            <Database className="mr-2 h-4 w-4" />
            {loading ? "Seeding..." : "Seed Sample Data"}
        </Button>
    )
}
