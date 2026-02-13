import { getPromotionPlans } from "@/lib/actions/promotions"
import { PromotionRequestForm } from "@/components/user/promotions/request-form"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = "force-dynamic"

export default async function NewPromotionPage() {
    // Fetch active plans only (default)
    const plans = await getPromotionPlans(false)

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Promotion Request</h1>
                    <p className="text-muted-foreground">Select a plan and upload your advertisement details.</p>
                </div>

                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <PromotionRequestForm plans={plans as any} />
                </div>
            </div>
        </DashboardLayout>
    )
}
