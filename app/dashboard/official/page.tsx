export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { requireAuth } from "@/lib/rbac"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { officials, members, organizations } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { format } from "date-fns"

export default async function OfficialDashboardPage() {
  const session = await getServerSession()
  const authSession = requireAuth(session)

  if (!authSession.user.officialId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Official Dashboard</h1>
          <p>You are not assigned as an official.</p>
        </div>
      </DashboardLayout>
    )
  }

  const officialData = await db.query.officials.findFirst({
    where: eq(officials.id, authSession.user.officialId),
  })

  // Manually fetch organization to avoid LATERAL JOIN in older MariaDB
  const organizationData = officialData?.organizationId ? await db.query.organizations.findFirst({
    where: eq(organizations.id, officialData.organizationId)
  }) : null;

  const official = officialData ? { ...officialData, organization: organizationData } : null;

  let memberCount = 0;
  if (official?.organizationId) {
    const res = await db.select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, official.organizationId));
    memberCount = res[0]?.count ?? 0;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Official Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Position Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">{official?.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{official?.organization?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Term Start:</span>
                <span className="font-medium">
                  {official?.termStart ? format(new Date(official.termStart), 'PP') : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberCount}</div>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

