import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Building2, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react"
import { SubaccountHierarchy } from "@/components/admin/settings/subaccount-hierarchy"
import { getBanks } from "@/lib/actions/payment-settings"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
    const session = await getServerSession()
    if (!session) return null

    const orgs = await db.select().from(organizations).orderBy(organizations.level)
    const banks = await getBanks()

    const linkedCount = orgs.filter(o => o.paystackSubaccountCode).length
    const unlinkedCount = orgs.length - linkedCount
    const linkedPercentage = orgs.length > 0 ? Math.round((linkedCount / orgs.length) * 100) : 0

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Button variant="ghost" size="sm" asChild>
                                <Link href="/dashboard/admin/settings">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Settings
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-green-700">
                            <CreditCard className="h-8 w-8" />
                            Jurisdiction Payment Setup
                        </h1>
                        <p className="text-muted-foreground">Manage Paystack Subaccounts for all organizational levels</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jurisdictions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orgs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Linked Subaccounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{linkedCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">{linkedPercentage}% compliance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Unlinked Subaccounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{unlinkedCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                        </CardContent>
                    </Card>
                </div>

                <SubaccountHierarchy organizations={orgs} banks={banks} />
            </div>
        </DashboardLayout>
    )
}
