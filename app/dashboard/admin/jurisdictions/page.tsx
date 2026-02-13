export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getJurisdictions } from "./actions"
import { JurisdictionList } from "./components/jurisdiction-list"
import { AddJurisdictionDialog } from "./components/add-jurisdiction-dialog"


export default async function JurisdictionsPage() {
    const session = await getServerSession()
    requirePermission(session, "organizations:read")

    // Fetch all data in parallel
    const [states, lgas, branches] = await Promise.all([
        getJurisdictions("STATE"),
        getJurisdictions("LOCAL_GOVERNMENT"),
        getJurisdictions("BRANCH"),
    ])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Jurisdiction Management</h1>
                    <p className="text-muted-foreground">Manage States, Local Governments, and Branches.</p>
                </div>

                <Tabs defaultValue="states" className="w-full">
                    <TabsList>
                        <TabsTrigger value="states">States</TabsTrigger>
                        <TabsTrigger value="lgas">Local Governments</TabsTrigger>
                        <TabsTrigger value="branches">Branches</TabsTrigger>
                    </TabsList>

                    <TabsContent value="states">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>States</CardTitle>
                                    <CardDescription>Manage state-level jurisdictions</CardDescription>
                                </div>
                                <AddJurisdictionDialog level="STATE" />
                            </CardHeader>
                            <CardContent>
                                <JurisdictionList
                                    data={states.success && states.data ? states.data : []}
                                    level="STATE"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="lgas">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>Local Governments</CardTitle>
                                    <CardDescription>Manage local government areas</CardDescription>
                                </div>
                                <AddJurisdictionDialog level="LOCAL_GOVERNMENT" />
                            </CardHeader>
                            <CardContent>
                                <JurisdictionList
                                    data={lgas.success && lgas.data ? lgas.data : []}
                                    level="LOCAL_GOVERNMENT"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branches">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>Branches</CardTitle>
                                    <CardDescription>Manage branch-level organizations</CardDescription>
                                </div>
                                <AddJurisdictionDialog level="BRANCH" />
                            </CardHeader>
                            <CardContent>
                                <JurisdictionList
                                    data={branches.success && branches.data ? branches.data : []}
                                    level="BRANCH"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
