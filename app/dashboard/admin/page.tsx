export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
// import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/rbac"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { members, payments, organizations, users, programmes, reports, promotions } from "@/lib/db/schema"
import { getOrganizationScope } from "@/lib/org-utils"
import { eq, count, and, or, desc, sum } from "drizzle-orm"
import { Calendar, FileText, Megaphone } from "lucide-react"
import { format } from "date-fns"
export default async function AdminDashboardPage() {
  const session = await getServerSession()
  requireAdmin(session)

  const orgScope = getOrganizationScope(session)

  // Helper filters
  const scopeFilter = (col: any) => orgScope ? eq(col, orgScope) : undefined
  const orgCountFilter = orgScope ? eq(organizations.parentId, orgScope) : undefined

  // Pending Programmes Logic:
  // If National (No Scope): View PENDING_NATIONAL
  // If State (Has Scope): View PENDING_STATE (ideally from children, but for now filtering by org directly or simplistic view)
  // For V1, we'll restrict "Pending" lists to items *belonging* to the current scope or leave global if null.
  // Actually, standardizing on seeing *my* organization's relevant data + children is complex in one go.
  // Let's scope strictly to data *owned* by the current level for stats.

  const [memberCountRes, paymentCountRes, organizationCountRes, pendingProgrammesRes, pendingReportsRes, lateProgrammesRes, pendingPromotionsRes, recentPayments] = await Promise.all([
    db.select({ count: count() }).from(members).where(scopeFilter(members.organizationId)),
    db.select({ count: count() }).from(payments).where(and(eq(payments.status, "SUCCESS"), scopeFilter(payments.organizationId))),
    db.select({ count: count() }).from(organizations).where(orgCountFilter),
    db.select({ count: count() }).from(programmes).where(and(or(eq(programmes.status, 'PENDING_STATE'), eq(programmes.status, 'PENDING_NATIONAL')), scopeFilter(programmes.organizationId))),
    db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'SUBMITTED'), scopeFilter(reports.organizationId))),
    db.select({ count: count() }).from(programmes).where(and(eq(programmes.isLateSubmission, true), scopeFilter(programmes.organizationId))),
    db.select({ count: count() }).from(promotions).where(eq(promotions.status, 'PENDING')),
    db.select({
      id: payments.id,
      amount: payments.amount,
      createdAt: payments.createdAt,
      user: {
        name: users.name,
        email: users.email,
      }
    })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(and(eq(payments.status, "SUCCESS"), scopeFilter(payments.organizationId)))
      .orderBy(desc(payments.createdAt))
      .limit(5),
  ])

  const memberCount = memberCountRes[0]?.count ?? 0
  const paymentCount = paymentCountRes[0]?.count ?? 0
  const organizationCount = organizationCountRes[0]?.count ?? 0
  const pendingProgrammes = pendingProgrammesRes[0]?.count ?? 0
  const pendingReports = pendingReportsRes[0]?.count ?? 0
  const lateProgrammes = lateProgrammesRes[0]?.count ?? 0
  const pendingPromotions = pendingPromotionsRes[0]?.count ?? 0

  const totalRevenueRes = await db.select({
    amount: sum(payments.amount)
  })
    .from(payments)
    .where(and(eq(payments.status, "SUCCESS"), scopeFilter(payments.organizationId)))

  const totalRevenue = totalRevenueRes[0]?.amount ?? "0"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                ₦{Number(totalRevenue).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-yellow-200 bg-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Programme Vetting</CardTitle>
              <Calendar className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingProgrammes}</div>
              <p className="text-xs text-white mt-1">
                Requiring State/National attention
                {lateProgrammes > 0 && <span className="text-red-200 font-semibold ml-2">({lateProgrammes} LATE)</span>}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Activity Reports</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingReports}</div>
              <p className="text-xs text-white mt-1">New submissions to review</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Promotions</CardTitle>
              <Megaphone className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingPromotions}</div>
              <p className="text-xs text-white mt-1">Advertisement requests to vet</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest successful payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{payment.user?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{payment.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" suppressHydrationWarning>₦{Number(payment.amount).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {payment.createdAt ? format(new Date(payment.createdAt), 'PP') : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

