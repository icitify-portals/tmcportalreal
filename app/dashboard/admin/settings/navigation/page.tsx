import { MenuBuilderClient } from "@/components/admin/navigation/menu-builder-client"
import { getNavigationItems } from "@/lib/actions/navigation"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = 'force-dynamic'



// Force rebuild: Navigation Settings Page
export default async function NavigationSettingsPage() {
    const { data } = await getNavigationItems(undefined, true) // Include inactive

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Navigation Menu</h3>
                    <p className="text-sm text-muted-foreground">
                        Organize the public website main navigation menu.
                        Drag items to reorder. Use "Edit" to change labels or move items into dropdowns.
                    </p>
                </div>
                <Separator />
                <MenuBuilderClient initialData={data || []} />
            </div>
        </DashboardLayout>
    )
}
