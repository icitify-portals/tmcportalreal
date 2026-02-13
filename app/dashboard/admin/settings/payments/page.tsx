import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Building2, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react"
import { SubaccountManager } from "@/components/admin/settings/subaccount-manager"
import { getBanks } from "@/lib/actions/payment-settings"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
    const session = await getServerSession()
    if (!session) return null

    const orgs = await db.select().from(organizations).orderBy(organizations.level)
    const banks = await getBanks()

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

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subaccount Integration Status</CardTitle>
                            <CardDescription>
                                Each jurisdiction must have a linked subaccount to collect funds directly into their specific bank accounts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orgs.map((org) => (
                                    <div key={org.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold flex items-center gap-2">
                                                    {org.name}
                                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 uppercase tracking-tighter shadow-sm font-normal">
                                                        {org.level}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {org.paystackSubaccountCode ? (
                                                        <span className="text-green-600 flex items-center gap-1 font-medium">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Linked: {org.paystackSubaccountCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 flex items-center gap-1 font-medium">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Not Integrated
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <SubaccountManager 
                                            organization={org} 
                                            banks={banks} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
