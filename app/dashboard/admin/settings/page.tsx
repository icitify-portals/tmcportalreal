export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Save, Globe, Shield, MessageSquare, Bell, CreditCard, Menu } from "lucide-react"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { EmailConfigDialog } from "@/components/admin/settings/email-config-dialog"
import { PushNotificationDialog } from "@/components/admin/settings/push-notification-dialog"
import { EmailTemplatesDialog } from "@/components/admin/settings/email-templates-dialog"


import { AiSettingsCard } from "@/components/admin/settings/ai-settings-card"
import { SecuritySettingsForm } from "@/components/admin/settings/security-settings-form"
import { getAISettings, getMembershipSettings } from "@/lib/actions/settings"

export default async function AdminSettingsPage() {
    const session = await getServerSession()
    const aiSettings = await getAISettings()
    const membershipSettings = await getMembershipSettings()

    // Fetch National Org as the "System Settings" source
    const nationalOrg = await db.query.organizations.findFirst({
        where: eq(organizations.level, "NATIONAL")
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Settings className="h-8 w-8 text-primary" />
                            System Settings
                        </h1>
                        <p className="text-muted-foreground">Configure global portal parameters and organization profile</p>
                    </div>
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save All Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    Organization Profile
                                </CardTitle>
                                <CardDescription>This information is visible on public pages and receipts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Portal Name</label>
                                        <input className="w-full p-2 border rounded-md" defaultValue={nationalOrg?.name || "Muslim Congress"} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Support Email</label>
                                        <input className="w-full p-2 border rounded-md" defaultValue={nationalOrg?.email || "support@tmcportal.org"} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Contact Phone</label>
                                        <input className="w-full p-2 border rounded-md" defaultValue={nationalOrg?.phone || "+234..."} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Website</label>
                                        <input className="w-full p-2 border rounded-md" defaultValue={nationalOrg?.website || "https://..."} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Welcome Message</label>
                                    <textarea className="w-full p-2 border rounded-md h-24" defaultValue={nationalOrg?.welcomeMessage || ""} />
                                </div>
                            </CardContent>
                        </Card>

                        <AiSettingsCard initialSettings={aiSettings} />

                        <SecuritySettingsForm initialSettings={membershipSettings} />
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <p className="text-muted-foreground">Configure how the system sends alerts.</p>
                                <EmailConfigDialog>
                                    <Button variant="outline" className="w-full text-xs">Configure SMTP Settings</Button>
                                </EmailConfigDialog>
                                <PushNotificationDialog>
                                    <Button variant="outline" className="w-full text-xs">Push Notification Gateway</Button>
                                </PushNotificationDialog>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Integrations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <p className="text-muted-foreground">Manage Paystack subaccounts and multi-jurisdiction settlements.</p>
                                <Button variant="outline" className="w-full text-xs" asChild>
                                    <Link href="/dashboard/admin/settings/payments">
                                        Configure Jurisdictions
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Messaging
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <p className="text-muted-foreground">Set default message templates for new members.</p>
                                <EmailTemplatesDialog>
                                    <Button variant="outline" className="w-full text-xs">Edit Templates</Button>
                                </EmailTemplatesDialog>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Menu className="h-5 w-5" />
                                    Website Navigation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <p className="text-muted-foreground">Manage the primary menu links and structure.</p>
                                <Button variant="outline" className="w-full text-xs" asChild>
                                    <Link href="/dashboard/admin/settings/navigation">
                                        Configure Menu
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
