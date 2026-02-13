export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserPlus } from "lucide-react"
import { OfficialAppointmentForm } from "@/components/admin/officials/official-appointment-form"

export default async function NewOfficialPage({
    searchParams
}: {
    searchParams: Promise<{ organizationId?: string }>
}) {
    const { organizationId } = await searchParams
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <UserPlus className="h-8 w-8 text-primary" />
                        Add New Official
                    </h1>
                    <p className="text-muted-foreground">Appoint a member to an official position within your jurisdiction</p>
                </div>
                <OfficialAppointmentForm initialOrgId={organizationId} />
            </div>
        </DashboardLayout>
    )
}
