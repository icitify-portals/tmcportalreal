export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/rbac"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { members, payments, organizations, promotions } from "@/lib/db/schema"
import { eq, desc, count, and } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Megaphone } from "lucide-react"

// ... imports

export default async function MemberDashboardPage() {
  const session = await getServerSession()
  const authSession = requireAuth(session)

  // Check if user has a member profile
  // Check if user has a member profile
  // Refactored to use standard joins to avoid "LATERAL" syntax error in some MySQL versions
  const memberResults = await db.select({
    id: members.id,
    userId: members.userId,
    organizationId: members.organizationId,
    memberId: members.memberId,
    status: members.status,
    membershipType: members.membershipType,
    dateJoined: members.dateJoined,
    // Organization details
    orgName: organizations.name,
  })
    .from(members)
    .leftJoin(organizations, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, authSession.user.id))
    .limit(1)

  const memberData = memberResults[0]

  // Fetch active promotions count
  const promotionCountRes = await db.select({ count: count() })
    .from(promotions)
    .where(and(
      eq(promotions.userId, authSession.user.id),
      eq(promotions.status, 'ACTIVE')
    ))
  const activePromotionCount = promotionCountRes[0]?.count ?? 0

  // If member exists, fetch their recent payments manually
  let memberPayments: any[] = []
  if (memberData) {
    memberPayments = await db.select()
      .from(payments)
      .where(eq(payments.memberId, memberData.id))
      .orderBy(desc(payments.createdAt))
      .limit(5)
  }

  const member = memberData ? {
    ...memberData,
    organization: {
      name: memberData.orgName
    },
    payments: memberPayments
  } : undefined

  const isMember = !!member

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, Member!</h1>
        </div>

        {/* Membership Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
          </CardHeader>
          <CardContent>
            {!isMember ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <span className="text-yellow-800 dark:text-yellow-200">
                    You are not yet a member
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Join our community by completing the membership application.
                </p>
                <Link href="/dashboard/member/apply">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Become a Member
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {member.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Your application is pending approval
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-green-800 dark:text-green-200">
                      You are an active member
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Member ID:</span>
                    <p className="font-medium">{member.memberId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p>
                      <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Organization:</span>
                    <p className="font-medium">{member.organization.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date Joined:</span>
                    <p className="font-medium">
                      {member.dateJoined ? format(new Date(member.dateJoined), 'PP') : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Activity Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Activity</CardTitle>
            <CardDescription>A summary of your engagement with the community.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>📅</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total events you have registered for.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>📄</span>
                  <span className="text-2xl font-bold">
                    {member?.payments.filter((p) => p.status === "SUCCESS").length || 0}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total number of fee payments made.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>❤️</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total number of donations contributed.
                </p>
              </div>
              <Link href="/dashboard/user/promotions" className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer block">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-5 w-5 text-purple-600" />
                  <span className="text-2xl font-bold">{activePromotionCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Active advertisements currently running.
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {isMember && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Your payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {member.payments.length > 0 ? (
                  member.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{payment.description || payment.paymentType}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), 'PP')}
                        </p>
                      </div>
                      <p className="font-medium">₦{payment.amount.toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No payments yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
