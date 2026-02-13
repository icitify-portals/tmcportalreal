export const dynamic = 'force-dynamic'
import { cn } from "@/lib/utils"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getFinanceAnalytics, getAvailableJurisdictions } from "@/lib/actions/analytics"
import {
    RevenueChart,
    ComplianceChart,
    BudgetActualChart,
    CampaignProgressBoard,
    CategoryChart
} from "@/components/admin/finance/finance-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, AlertCircle, PieChart } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { JurisdictionFilter } from "./jurisdiction-filter"

export default async function FinanceAnalyticsPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>
}) {
    const { orgId } = await searchParams
    const response = await getFinanceAnalytics(orgId)
    const jurisdictions = await getAvailableJurisdictions()

    if (!response.success) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-red-500 font-medium">Failed to load analytics: {response.error}</p>
                </div>
            </DashboardLayout>
        )
    }

    const data = response.data || {} as any
    const {
        monthlyRevenue = [],
        compliance = { rate: 0, paid: 0, pending: 0 },
        campaigns = [],
        budget = { allocated: 0, spent: 0 },
        revenueByCategory = [],
        revenueTrend = 0
    } = data

    const currentRevenueTrend = typeof revenueTrend === 'number' ? revenueTrend : 0
    const trendColor = currentRevenueTrend >= 0 ? "text-green-500" : "text-red-500"
    const secondaryTrendColor = currentRevenueTrend >= 0 ? "text-green-600" : "text-red-600 font-medium"
    const trendSymbol = currentRevenueTrend >= 0 ? "+" : ""
    const trendIconSymbol = currentRevenueTrend >= 0 ? "↑" : "↓"

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-8 w-8 text-primary" />
                            Financial Analytics
                        </h1>
                        <p className="text-muted-foreground">Comprehensive financial health and compliance overview.</p>
                    </div>

                    {jurisdictions.length > 0 && (
                        <div className="w-full md:w-64">
                            <JurisdictionFilter
                                jurisdictions={jurisdictions}
                                currentId={orgId}
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <TrendingUp className={cn("h-4 w-4", trendColor)} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" suppressHydrationWarning>
                                N{monthlyRevenue[monthlyRevenue.length - 1]?.total.toLocaleString() || 0}
                            </div>
                            <div className="flex items-center gap-1 text-xs mt-1">
                                <span className={secondaryTrendColor}>
                                    {trendSymbol}{currentRevenueTrend.toFixed(1)}%
                                </span>
                                <span className="text-muted-foreground">from last month</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                            <PieChart className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{compliance.rate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">{compliance.paid} / {compliance.paid + compliance.pending} Assignments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {budget.allocated > 0 ? ((budget.spent / budget.allocated) * 100).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">Actual vs Approved</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                            <BarChart3 className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaigns.length}</div>
                            <p className="text-xs text-muted-foreground">Currently Fundraising</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RevenueChart data={monthlyRevenue} />
                    <ComplianceChart data={compliance} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <CategoryChart data={revenueByCategory} />
                    <BudgetActualChart data={budget} />
                    <CampaignProgressBoard campaigns={campaigns} />
                </div>
            </div>
        </DashboardLayout>
    )
}
