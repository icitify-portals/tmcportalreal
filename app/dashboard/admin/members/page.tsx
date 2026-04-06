export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { members, users, organizations } from "@/lib/db/schema"
import { desc, and, eq, sql } from "drizzle-orm"
import Link from "next/link"
import { Plus, Search, Filter } from "lucide-react"
import { MemberStatsDialog } from "@/components/admin/members/member-stats-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { locationData } from "@/lib/location-data"
import { Pagination } from "@/components/admin/shared/pagination"
import { ExportCSV } from "@/components/admin/shared/export-csv"
import { Suspense } from "react"


export default async function MembersPage(props: {
  searchParams: Promise<{ state?: string; lga?: string; branch?: string; search?: string; page?: string; limit?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await getServerSession()
  requirePermission(session, "members:read")

  const stateFilter = searchParams.state
  const lgaFilter = searchParams.lga
  const branchFilter = searchParams.branch
  const searchQuery = searchParams.search
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "50")
  const offset = (page - 1) * limit

  let conditions = []

  if (stateFilter && stateFilter !== "all") {
    conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.state')) = ${stateFilter}`)
  }
  if (lgaFilter && lgaFilter !== "all") {
    conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.lga')) = ${lgaFilter}`)
  }
  if (branchFilter && branchFilter !== "all") {
    conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.branch')) = ${branchFilter}`)
  }
  if (searchQuery) {
    // Basic search on name/email would require join, for now let's skip or implement if needed
    // The user had 'search' in params but it wasn't used in the original code's conditions
  }

  // 0. Fetch Total Count for pagination
  const [totalRes] = await db.select({ count: sql<number>`count(*)` })
    .from(members)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const totalCount = Number(totalRes?.count || 0);

  // Fetch members
  const rawMembers = await db.select()
    .from(members)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(members.createdAt))
    .limit(limit)
    .offset(offset)

  // Manually fetch related data
  const userIds = [...new Set(rawMembers.map(m => m.userId).filter(Boolean))] as string[]
  const orgIds = [...new Set(rawMembers.map(m => m.organizationId).filter(Boolean))] as string[]

  const usersData = userIds.length > 0 ? await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, userIds),
    columns: { id: true, name: true, email: true, phone: true }
  }) : []

  const orgsData = orgIds.length > 0 ? await db.query.organizations.findMany({
    where: (organizations, { inArray }) => inArray(organizations.id, orgIds),
    columns: { id: true, name: true, level: true }
  }) : []

  const membersList = rawMembers.map(member => ({
    ...member,
    user: usersData.find(u => u.id === member.userId) || { name: 'Unknown', email: '', phone: '' },
    organization: orgsData.find(o => o.id === member.organizationId) || { name: 'Unknown', level: '' }
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground">Manage organization members</p>
          </div>
          <div className="flex gap-2">
            <MemberStatsDialog />
            <Link href="/dashboard/admin/members/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="pt-6">
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">State</Label>
                <Select name="state" defaultValue={stateFilter || "all"}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {Object.keys(locationData).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">LGA</Label>
                <Select name="lga" defaultValue={lgaFilter || "all"} disabled={!stateFilter || stateFilter === "all"}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All LGAs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LGAs</SelectItem>
                    {stateFilter && stateFilter !== "all" && (locationData as any)[stateFilter]?.lgas.map((l: any) => (
                      <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Branch Keyword</Label>
                <Input
                  name="branch"
                  placeholder="Filter branch..."
                  defaultValue={branchFilter}
                  className="bg-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white">
                  <Search className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                {(stateFilter || lgaFilter || branchFilter) && (
                  <Link href="/dashboard/admin/members">
                    <Button variant="outline" type="button">Reset</Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>All Members</CardTitle>
              <CardDescription>List of all registered members</CardDescription>
            </div>
            <Suspense fallback={<Button variant="outline" size="sm" disabled>Exporting...</Button>}>
              <MemberExportWrapper searchParams={searchParams} />
            </Suspense>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {membersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 w-12 text-muted-foreground text-xs font-normal">S/N</th>
                        <th className="text-left p-2">Member ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">State</th>
                        <th className="text-left p-2">LGA</th>
                        <th className="text-left p-2">Branch / Org</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersList.map((member, index) => {
                        const metadata = member.metadata as any || {}
                        return (
                          <tr key={member.id} className="border-b">
                            <td className="p-2 text-muted-foreground text-xs">{offset + index + 1}</td>
                            <td className="p-2 font-mono text-sm">{member.memberId || "Pending"}</td>
                            <td className="p-2">
                              <div>{member.user.name}</div>
                              <div className="text-xs text-muted-foreground">{member.user.email}</div>
                            </td>
                            <td className="p-2">{metadata.state || "-"}</td>
                            <td className="p-2">{metadata.lga || "-"}</td>
                            <td className="p-2">
                              {metadata.branch ? (
                                <div className="text-sm">
                                  <span className="font-medium">{metadata.branch}</span>
                                  <br />
                                  <Badge variant="outline" className="text-[10px]">{member.organization.name}</Badge>
                                </div>
                              ) : (
                                <Badge variant="outline">{member.organization.name}</Badge>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  member.status === "ACTIVE"
                                    ? "default"
                                    : member.status === "PENDING"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {member.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Link href={`/dashboard/admin/members/${member.id}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Pagination 
                total={totalCount} 
                page={page} 
                limit={limit} 
                baseUrl="/dashboard/admin/members" 
                searchParams={{ state: stateFilter, lga: lgaFilter, branch: branchFilter }} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

}

async function MemberExportWrapper({ searchParams }: { searchParams: any }) {
    let conditions = []

    if (searchParams.state && searchParams.state !== "all") {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.state')) = ${searchParams.state}`)
    }
    if (searchParams.lga && searchParams.lga !== "all") {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.lga')) = ${searchParams.lga}`)
    }
    if (searchParams.branch && searchParams.branch !== "all") {
        conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${members.metadata}, '$.branch')) = ${searchParams.branch}`)
    }

    const rawExport = await db.select()
        .from(members)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(members.createdAt))
        .limit(1000);

    // Fetch user details for export
    const userIds = rawExport.map(m => m.userId).filter(Boolean) as string[]
    const usersData = userIds.length > 0 ? await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
        columns: { id: true, name: true, email: true }
    }) : []

    const exportData = rawExport.map(m => {
        const user = usersData.find(u => u.id === m.userId)
        const meta = m.metadata as any || {}
        return {
            memberId: m.memberId || "PENDING",
            name: user?.name || "Unknown",
            email: user?.email || "",
            state: meta.state || "",
            lga: meta.lga || "",
            branch: meta.branch || "",
            status: m.status,
            createdAt: m.createdAt
        }
    })

    const headers = [
        { key: 'memberId', label: 'Member ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'state', label: 'State' },
        { key: 'lga', label: 'LGA' },
        { key: 'branch', label: 'Branch' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Joined' },
    ]

    return <ExportCSV data={exportData} filename="members" headers={headers} />
}
