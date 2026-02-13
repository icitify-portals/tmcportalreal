export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { db } from "@/lib/db"
import { organizations, officials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer"
import { BroadcastList } from "@/components/broadcasts/broadcast-list"
import { getBroadcasts } from "@/lib/actions/broadcasts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default async function BroadcastsPage() {
    const session = await getServerSession()
    if (!session || !session.user) return null

    // 1. Fetch official profile to see if they can send broadcasts
    // Refactored to avoid LATERAL JOIN
    const officialRows = await db.select({
        official: officials,
        organization: organizations
    })
        .from(officials)
        .leftJoin(organizations, eq(officials.organizationId, organizations.id))
        .where(eq(officials.userId, session.user.id))
        .limit(1)

    const official = officialRows[0] ? { ...officialRows[0].official, organization: officialRows[0].organization } : null

    // 2. Fetch all organizations for the composer (if official or superadmin)
    // Superadmin check
    const isSuperAdmin = session.user.isSuperAdmin

    let allOrgs: any[] = []
    if (official || isSuperAdmin) {
        allOrgs = await db.select().from(organizations)
            .where(eq(organizations.isActive, true))
    }

    // 3. Fetch broadcasts for the user
    const broadcasts = await getBroadcasts()

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
                        <p className="text-muted-foreground">Official announcements from your jurisdiction.</p>
                    </div>
                </div>

                {official || isSuperAdmin ? (
                    <Tabs defaultValue="feed" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-11 bg-muted/50 p-1">
                            <TabsTrigger value="feed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background shadow-sm">
                                Broadcast Feed
                            </TabsTrigger>
                            <TabsTrigger value="send" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background shadow-sm">
                                Send Message
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="feed" className="space-y-6 outline-none">
                            <BroadcastList broadcasts={broadcasts} currentUserId={session.user.id} />
                        </TabsContent>
                        <TabsContent value="send" className="outline-none">
                            <div className="max-w-3xl">
                                <BroadcastComposer
                                    organizations={allOrgs}
                                    currentUserOrg={official?.organization || null}
                                    isSuperAdmin={isSuperAdmin}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-6">
                        <BroadcastList broadcasts={broadcasts} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
