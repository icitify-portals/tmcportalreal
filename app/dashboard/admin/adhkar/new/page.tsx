export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdhkarForm } from "@/components/admin/adhkar/adhkar-form"

export default function NewAdhkarCentrePage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Add Adhkar Centre</h1>
                    <p className="text-muted-foreground">Register a new location for weekly Adhkar</p>
                </div>
                <AdhkarForm />
            </div>
        </DashboardLayout>
    )
}
