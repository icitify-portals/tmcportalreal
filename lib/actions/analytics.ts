"use server"

import { db } from "@/lib/db"
import {
    payments,
    organizations,
    financeTransactions,
    financeBudgets,
    fees,
    feeAssignments,
    fundraisingCampaigns,
    orgLevelEnum
} from "@/lib/db/schema"
import { eq, and, gte, lte, sql, inArray, sum, desc } from "drizzle-orm"
import { getServerSession } from "@/lib/session"

async function getDescendantOrgIds(parentId: string): Promise<string[]> {
    const orgIds = [parentId];
    const children = await db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.parentId, parentId));

    for (const child of children) {
        const descendantIds = await getDescendantOrgIds(child.id);
        orgIds.push(...descendantIds);
    }

    return orgIds;
}

export async function getFinanceAnalytics(organizationId?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        let targetOrgIds: string[] = []
        if (organizationId) {
            targetOrgIds = await getDescendantOrgIds(organizationId)
        } else {
            // Default to user's org if not specified, or all if super admin
            const userOrgId = session.user.organizationId
            if (session.user.isSuperAdmin) {
                const allOrgs = await db.select({ id: organizations.id }).from(organizations)
                targetOrgIds = allOrgs.map(o => o.id)
            } else if (userOrgId) {
                targetOrgIds = await getDescendantOrgIds(userOrgId)
            }
        }

        if (targetOrgIds.length === 0) return {
            success: true,
            data: {
                monthlyRevenue: [],
                compliance: { paid: 0, pending: 0, rate: 0 },
                campaigns: [],
                budget: { allocated: 0, spent: 0 }
            }
        }

        // 1. Monthly Revenue (Payments + Inflow Transactions)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
        sixMonthsAgo.setDate(1)

        const monthlyPayments = await db.select({
            month: sql<string>`DATE_FORMAT(${payments.createdAt}, '%Y-%m')`,
            total: sum(payments.amount)
        })
            .from(payments)
            .where(and(
                inArray(payments.organizationId, targetOrgIds),
                eq(payments.status, 'SUCCESS'),
                gte(payments.createdAt, sixMonthsAgo)
            ))
            .groupBy(sql`DATE_FORMAT(${payments.createdAt}, '%Y-%m')`)

        const monthlyInflows = await db.select({
            month: sql<string>`DATE_FORMAT(${financeTransactions.date}, '%Y-%m')`,
            total: sum(financeTransactions.amount)
        })
            .from(financeTransactions)
            .where(and(
                inArray(financeTransactions.organizationId, targetOrgIds),
                eq(financeTransactions.type, 'INFLOW'),
                gte(financeTransactions.date, sixMonthsAgo)
            ))
            .groupBy(sql`DATE_FORMAT(${financeTransactions.date}, '%Y-%m')`)

        // Merge sources
        const monthlyDataMap: Record<string, number> = {}
        monthlyPayments.forEach(p => { if (p.month) monthlyDataMap[p.month] = (monthlyDataMap[p.month] || 0) + parseFloat(p.total || "0") })
        monthlyInflows.forEach(i => { if (i.month) monthlyDataMap[i.month] = (monthlyDataMap[i.month] || 0) + parseFloat(i.total || "0") })

        const monthlyRevenue = Object.entries(monthlyDataMap)
            .map(([month, total]) => ({ month, total }))
            .sort((a, b) => a.month.localeCompare(b.month))

        // 1b. Revenue by Category
        const categoryStats = await db.select({
            category: payments.paymentType,
            total: sum(payments.amount)
        })
            .from(payments)
            .where(and(
                inArray(payments.organizationId, targetOrgIds),
                eq(payments.status, 'SUCCESS')
            ))
            .groupBy(payments.paymentType)

        // 1c. Trend calculation (Current vs Last Month)
        const currentMonthStr = new Date().toISOString().slice(0, 7)
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const lastMonthStr = lastMonth.toISOString().slice(0, 7)

        const currentRevenue = monthlyDataMap[currentMonthStr] || 0
        const previousRevenue = monthlyDataMap[lastMonthStr] || 0
        const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

        // 2. Compliance (Paid vs Pending)
        const complianceStats = await db.select({
            status: feeAssignments.status,
            count: sql<number>`count(*)`
        })
            .from(feeAssignments)
            .innerJoin(fees, eq(feeAssignments.feeId, fees.id))
            .where(inArray(fees.organizationId, targetOrgIds))
            .groupBy(feeAssignments.status)

        const paid = complianceStats.find(s => s.status === 'PAID')?.count || 0
        const pending = complianceStats.find(s => s.status === 'PENDING')?.count || 0
        const totalFees = paid + pending
        const complianceRate = totalFees > 0 ? (paid / totalFees) * 100 : 0

        // 3. Campaigns
        const campaigns = await db.query.fundraisingCampaigns.findMany({
            where: inArray(fundraisingCampaigns.organizationId, targetOrgIds),
            orderBy: [desc(fundraisingCampaigns.createdAt)],
            limit: 5
        })

        // 4. Budget vs Actual
        const currentYear = new Date().getFullYear()
        const budgets = await db.select({
            total: sum(financeBudgets.totalAmount)
        })
            .from(financeBudgets)
            .where(and(
                inArray(financeBudgets.organizationId, targetOrgIds),
                eq(financeBudgets.year, currentYear),
                eq(financeBudgets.status, 'APPROVED')
            ))

        const outflows = await db.select({
            total: sum(financeTransactions.amount)
        })
            .from(financeTransactions)
            .where(and(
                inArray(financeTransactions.organizationId, targetOrgIds),
                eq(financeTransactions.type, 'OUTFLOW'),
                sql`YEAR(${financeTransactions.date}) = ${currentYear}`
            ))

        return {
            success: true,
            data: {
                monthlyRevenue,
                revenueTrend,
                revenueByCategory: categoryStats.map(c => ({
                    name: c.category || 'Other',
                    value: parseFloat(c.total || "0")
                })),
                compliance: { paid, pending, rate: complianceRate },
                campaigns: campaigns.map(c => ({
                    name: c.title,
                    target: parseFloat(c.targetAmount || "0"),
                    raised: parseFloat(c.raisedAmount || "0"),
                    percentage: (parseFloat(c.raisedAmount || "0") / parseFloat(c.targetAmount || "0")) * 100
                })),
                budget: {
                    allocated: parseFloat(budgets[0]?.total || "0"),
                    spent: parseFloat(outflows[0]?.total || "0")
                }
            }
        }

    } catch (error: any) {
        console.error("Finance Analytics Error:", error)
        return { success: false, error: error.message }
    }
}

export async function getAvailableJurisdictions() {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return []

        const isAdmin = session.user.isSuperAdmin ||
            session.user.roles?.some((r: any) => r.jurisdictionLevel === "SYSTEM" || r.jurisdictionLevel === "NATIONAL")

        if (isAdmin) {
            return await db.select({
                id: organizations.id,
                name: organizations.name,
                level: organizations.level
            }).from(organizations).where(inArray(organizations.level, ['NATIONAL', 'STATE']))
        }

        return []
    } catch (error) {
        return []
    }
}
