export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { members } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import Link from "next/link"
import { Plus } from "lucide-react"


export default async function MembersPage() {
  const session = await getServerSession()
  requirePermission(session, "members:read")

  // Fetch members without relations to avoid LATERAL JOIN issues
  const rawMembers = await db.query.members.findMany({
    orderBy: [desc(members.createdAt)],
    limit: 50,
  })

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
          <Link href="/dashboard/admin/members/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>List of all registered members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {membersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Member ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Organization</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersList.map((member) => (
                        <tr key={member.id} className="border-b">
                          <td className="p-2 font-mono text-sm">{member.memberId}</td>
                          <td className="p-2">{member.user.name}</td>
                          <td className="p-2">{member.user.email}</td>
                          <td className="p-2">
                            <Badge variant="outline">{member.organization.name}</Badge>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

