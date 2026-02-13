import { getTeskiyahCentres } from "@/lib/actions/teskiyah"
import { TeskiyahList } from "./teskiyah-list"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = 'force-dynamic'


export default async function TeskiyahAdminPage() {
    const { data } = await getTeskiyahCentres({ limit: 500 })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Teskiyah Centres</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage weekly Teskiyah gathering locations and schedules.
                    </p>
                </div>
                <TeskiyahList data={data || []} />
            </div>
        </DashboardLayout>
    )
}
