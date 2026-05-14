export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { requireAuth } from "@/lib/rbac"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { officials, members, organizations } from "@/lib/db/schema"
import { eq, count, sql, and } from "drizzle-orm"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

import { getMockJurisdiction } from "@/lib/mock-jurisdiction"

export default async function OfficialDashboardPage() {
  const session = await getServerSession()
  const authSession = requireAuth(session)

  const mock = await getMockJurisdiction()
  const isSuperAdmin = session?.user?.roles?.some((r: any) => r.jurisdictionLevel === "SYSTEM")

  if (!authSession.user.officialId && !(isSuperAdmin && mock)) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Official Dashboard</h1>
          <p>You are not assigned as an official.</p>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch/Mock Official Data
  let official: any = null

  if (isSuperAdmin && mock) {
    const mockOrg = await db.query.organizations.findFirst({
        where: (org, { and, eq }) => {
            const conds = [eq(org.level, mock.level as any)]
            if (mock.state) conds.push(eq(org.state, mock.state))
            if (mock.lga) conds.push(eq(org.city, mock.lga))
            return and(...conds)
        }
    })
    
    official = {
        position: `Mock ${mock.level} Admin`,
        positionLevel: mock.level,
        organization: mockOrg || { name: `Mock ${mock.level}`, state: mock.state, city: mock.lga },
        termStart: new Date()
    }
  } else {
    const officialData = await db.query.officials.findFirst({
        where: eq(officials.id, authSession.user.officialId!),
    })
    const organizationData = officialData?.organizationId ? await db.query.organizations.findFirst({
        where: eq(organizations.id, officialData.organizationId)
    }) : null;
    official = officialData ? { ...officialData, organization: organizationData } : null;
  }

  // Jurisdiction-aware member count
  let memberCount = 0;
  if (official) {
    const { positionLevel, organizationId, organization } = official;
    let conditions = [];

    if (positionLevel === 'STATE') {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.state')) = ${organization?.state}`);
    } else if (positionLevel === 'LOCAL_GOVERNMENT') {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.state')) = ${organization?.state}`);
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.lga')) = ${organization?.city}`);
    } else if (positionLevel === 'BRANCH') {
        conditions.push(eq(members.organizationId, organizationId));
    } else if (positionLevel === 'NATIONAL') {
        // No filter for National officials on the total count
    }

    const res = await db.select({ count: count() })
      .from(members)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Organization Statistics</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{memberCount}</div>
                  <p className="text-sm text-muted-foreground">Total Members in Jurisdiction</p>
                </div>
                <Link href="/dashboard/official/members">
                    <Button variant="outline" size="sm">View All Members</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

