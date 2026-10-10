
"use server"

import { db } from "@/lib/db"
import {
    financeBudgets, financeBudgetItems, financeFundRequests, financeTransactions,
    budgetStatusEnum, requestStatusEnum, transactionTypeEnum,
    users, organizations, officials, roles, userRoles
} from "@/lib/db/schema"
import { eq, desc, and, inArray, aliasedTable } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { sendEmail, emailTemplates } from "@/lib/email"

// Schemas
const BudgetSchema = z.object({
    year: z.number().min(2025, "Year must be 2025 or later"),
    title: z.string().min(1, "Title is required"),
    items: z.array(z.object({
        category: z.string(),
        description: z.string(),
        amount: z.number().positive(),
    })).min(1, "At least one budget item is required"),
})

const RequestSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be detailed"),
    amount: z.number().positive("Amount must be positive"),
})

const InflowSchema = z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    description: z.string().min(1),
    date: z.date().optional(),
})

// --- Budgets ---

export async function createBudget(data: z.infer<typeof BudgetSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = BudgetSchema.parse(data)
        const totalAmount = validData.items.reduce((sum, item) => sum + item.amount, 0)

        // Transaction
        const budgetId = await db.transaction(async (tx) => {
            const [newBudget] = await tx.insert(financeBudgets).values({
                organizationId,
                year: validData.year,
                title: validData.title,
                totalAmount: totalAmount.toString(),
                status: 'SUBMITTED', // Auto-submit or DRAFT? Let's say SUBMITTED for now
                createdBy: session.user.id,
            }).$returningId()

            if (!newBudget?.id) throw new Error("Failed to create budget")

            for (const item of validData.items) {
                await tx.insert(financeBudgetItems).values({
                    budgetId: newBudget.id,
                    category: item.category,
                    description: item.description,
                    amount: item.amount.toString(),
                })
            }
            return newBudget.id
        })

        revalidatePath("/dashboard/admin/finance/budgets")
        return { success: true, budgetId }
    } catch (error) {
        console.error("Create Budget Error:", error)
        return { success: false, error: "Failed to create budget" }
    }
}

export async function approveBudget(budgetId: string) {
    try {
        const session = await getServerSession()
        // Here we should check if user is HEAD. For now assuming RBAC middleware handles route access
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(financeBudgets).set({
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
        }).where(eq(financeBudgets.id, budgetId))

        revalidatePath("/dashboard/admin/finance/budgets")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to approve budget" }
    }
}

export async function getBudgets(organizationId: string) {
    const creator = aliasedTable(users, "creator")
    const approver = aliasedTable(users, "approver")

    const budgetsRaw = await db.select({
        budget: financeBudgets,
        creator: creator,
        approver: approver,
    })
        .from(financeBudgets)
        .leftJoin(creator, eq(financeBudgets.createdBy, creator.id))
        .leftJoin(approver, eq(financeBudgets.approvedBy, approver.id))
        .where(eq(financeBudgets.organizationId, organizationId))
        .orderBy(desc(financeBudgets.createdAt))

    if (budgetsRaw.length === 0) return []

    const budgetIds = budgetsRaw.map(r => r.budget.id)

    // Fetch items separately to avoid cartesian explosion and LATERAL join issues
    const items = await db.select().from(financeBudgetItems)
        .where(inArray(financeBudgetItems.budgetId, budgetIds))

    // Stitch together
    return budgetsRaw.map(row => ({
        ...row.budget,
        creator: row.creator,
        approver: row.approver,
        items: items.filter(i => i.budgetId === row.budget.id)
    }))
}

// --- Fund Requests ---

export async function createFundRequest(data: z.infer<typeof RequestSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = RequestSchema.parse(data)

        const [newReq] = await db.insert(financeFundRequests).values({
            organizationId,
            requesterId: session.user.id,
            title: validData.title,
            description: validData.description,
            amount: validData.amount.toString(),
            status: 'PENDING',
        }).$returningId()

        // Fetch requester and organization info for email notification
        const org = await db.select({ name: organizations.name, level: organizations.level }).from(organizations).where(eq(organizations.id, organizationId)).limit(1)
        const requester = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1)

        const orgName = org[0]?.name || "TMC Organization"
        const requesterName = requester[0]?.name || "Officer"
        const trackingUrl = `${process.env.NEXTAUTH_URL || ""}/dashboard/admin/finance/requests`

        if (requester[0]?.email) {
            const template = emailTemplates.fundRequestNotification(
                requesterName,
                requesterName,
                validData.title,
                validData.amount,
                orgName,
                "SUBMITTED",
                requesterName,
                undefined,
                trackingUrl
            )
            await sendEmail({
                to: requester[0].email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            }).catch(console.error)
        }

        revalidatePath("/dashboard/admin/finance/requests")
        return { success: true, id: newReq?.id }
    } catch (error) {
        console.error("Create Request Error:", error)
        return { success: false, error: "Failed to create request" }
    }
}

export async function recommendRequest(requestId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(financeFundRequests).set({
            status: 'RECOMMENDED',
            recommendedBy: session.user.id,
            recommendedAt: new Date(),
        }).where(eq(financeFundRequests.id, requestId))

        revalidatePath("/dashboard/admin/finance/requests")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Action failed" }
    }
}

export async function approveRequest(requestId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const [request] = await db.select().from(financeFundRequests).where(eq(financeFundRequests.id, requestId))
        if (!request) return { success: false, error: "Request not found" }

        await db.update(financeFundRequests).set({
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
        }).where(eq(financeFundRequests.id, requestId))

        // Notify requester and financial secretaries
        const requester = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, request.requesterId)).limit(1)
        const approver = await db.select({ name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1)
        const org = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, request.organizationId)).limit(1)

        const orgName = org[0]?.name || "TMC"
        const requesterName = requester[0]?.name || "Officer"
        const approverName = approver[0]?.name || "Executive Leader"
        const trackingUrl = `${process.env.NEXTAUTH_URL || ""}/dashboard/admin/finance/requests`

        if (requester[0]?.email) {
            const template = emailTemplates.fundRequestNotification(
                requesterName,
                requesterName,
                request.title,
                parseFloat(request.amount.toString()),
                orgName,
                "APPROVED",
                approverName,
                undefined,
                trackingUrl
            )
            await sendEmail({
                to: requester[0].email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            }).catch(console.error)
        }

        revalidatePath("/dashboard/admin/finance/requests")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Action failed" }
    }
}

export async function rejectRequest(requestId: string, reason: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const [request] = await db.select().from(financeFundRequests).where(eq(financeFundRequests.id, requestId))
        if (!request) return { success: false, error: "Request not found" }

        await db.update(financeFundRequests).set({
            status: 'REJECTED',
            rejectionReason: reason,
        }).where(eq(financeFundRequests.id, requestId))

        const requester = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, request.requesterId)).limit(1)
        const user = await db.select({ name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1)
        const org = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, request.organizationId)).limit(1)

        if (requester[0]?.email) {
            const template = emailTemplates.fundRequestNotification(
                requester[0].name || "Officer",
                requester[0].name || "Officer",
                request.title,
                parseFloat(request.amount.toString()),
                org[0]?.name || "TMC",
                "REJECTED",
                user[0]?.name || "Administrator",
                reason,
                `${process.env.NEXTAUTH_URL || ""}/dashboard/admin/finance/requests`
            )
            await sendEmail({
                to: requester[0].email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            }).catch(console.error)
        }

        revalidatePath("/dashboard/admin/finance/requests")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Action failed" }
    }
}

export async function disburseRequest(requestId: string, voucherRef?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        // Fetch request first to check status
        const [request] = await db.select().from(financeFundRequests)
            .where(eq(financeFundRequests.id, requestId));

        if (!request) return { success: false, error: "Request not found" }
        if (request.status !== 'APPROVED') return { success: false, error: "Request must be approved by Executive Leader first" }

        // Start Transaction
        await db.transaction(async (tx) => {
            // 1. Update Request Status
            await tx.update(financeFundRequests).set({
                status: 'DISBURSED',
                disbursedBy: session.user.id,
                disbursedAt: new Date(),
            }).where(eq(financeFundRequests.id, requestId))

            // 2. Create Outflow Transaction
            await tx.insert(financeTransactions).values({
                organizationId: request.organizationId,
                type: 'OUTFLOW',
                amount: request.amount,
                category: 'Expense',
                description: `Disbursement for: ${request.title}${voucherRef ? ` (Ref: ${voucherRef})` : ""}`,
                performedBy: session.user.id,
                relatedRequestId: request.id,
                date: new Date(),
            })
        })

        // Send Disbursement email
        const requester = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, request.requesterId)).limit(1)
        const disburser = await db.select({ name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1)
        const org = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, request.organizationId)).limit(1)

        if (requester[0]?.email) {
            const template = emailTemplates.fundRequestNotification(
                requester[0].name || "Officer",
                requester[0].name || "Officer",
                request.title,
                parseFloat(request.amount.toString()),
                org[0]?.name || "TMC",
                "DISBURSED",
                disburser[0]?.name || "Financial Secretary",
                undefined,
                `${process.env.NEXTAUTH_URL || ""}/dashboard/admin/finance/requests`
            )
            await sendEmail({
                to: requester[0].email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            }).catch(console.error)
        }

        revalidatePath("/dashboard/admin/finance/requests")
        revalidatePath("/dashboard/admin/finance/transactions")
        return { success: true }
    } catch (error) {
        console.error("Disburse error:", error)
        return { success: false, error: "Disbursement failed" }
    }
}

export async function getRequests(organizationId?: string) {
    const requester = aliasedTable(users, "requester")
    const recommender = aliasedTable(users, "recommender")
    const approver = aliasedTable(users, "approver")
    const disburser = aliasedTable(users, "disburser")

    const query = db.select({
        request: financeFundRequests,
        requester: requester,
        recommender: recommender,
        approver: approver,
        disburser: disburser,
        orgName: organizations.name,
        orgLevel: organizations.level,
    })
        .from(financeFundRequests)
        .leftJoin(requester, eq(financeFundRequests.requesterId, requester.id))
        .leftJoin(recommender, eq(financeFundRequests.recommendedBy, recommender.id))
        .leftJoin(approver, eq(financeFundRequests.approvedBy, approver.id))
        .leftJoin(disburser, eq(financeFundRequests.disbursedBy, disburser.id))
        .leftJoin(organizations, eq(financeFundRequests.organizationId, organizations.id))

    const rows = organizationId
        ? await query.where(eq(financeFundRequests.organizationId, organizationId)).orderBy(desc(financeFundRequests.createdAt))
        : await query.orderBy(desc(financeFundRequests.createdAt))

    return rows.map(row => ({
        ...row.request,
        requester: row.requester,
        recommender: row.recommender,
        approver: row.approver,
        disburser: row.disburser,
        organizationName: row.orgName,
        organizationLevel: row.orgLevel,
    }))
}

// --- Transactions & Ledger ---

export async function recordInflow(data: z.infer<typeof InflowSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = InflowSchema.parse(data)

        await db.insert(financeTransactions).values({
            organizationId,
            type: 'INFLOW',
            amount: validData.amount.toString(),
            category: validData.category,
            description: validData.description,
            performedBy: session.user.id,
            date: validData.date || new Date(),
        })

        revalidatePath("/dashboard/admin/finance/transactions")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to record inflow" }
    }
}

export async function getTransactions(organizationId: string) {
    const performer = aliasedTable(users, "performer")

    // We might want related request details too
    const requests = aliasedTable(financeFundRequests, "requests")

    const results = await db.select({
        transaction: financeTransactions,
        performer: performer,
        relatedRequest: requests
    })
        .from(financeTransactions)
        .leftJoin(performer, eq(financeTransactions.performedBy, performer.id))
        .leftJoin(requests, eq(financeTransactions.relatedRequestId, requests.id))
        .where(eq(financeTransactions.organizationId, organizationId))
        .orderBy(desc(financeTransactions.date))

    return results.map(row => ({
        ...row.transaction,
        performer: row.performer,
        relatedRequest: row.relatedRequest
    }))
}

export async function getFinancialSummary(organizationId: string) {
    const txs = await db.select().from(financeTransactions)
        .where(eq(financeTransactions.organizationId, organizationId))

    let totalInflow = 0
    let totalOutflow = 0

    txs.forEach(t => {
        const amt = parseFloat(t.amount.toString()) // Decimal is string in JS usually with Drizzle unless configured
        if (t.type === 'INFLOW') totalInflow += amt
        if (t.type === 'OUTFLOW') totalOutflow += amt
    })

    return {
        balance: totalInflow - totalOutflow,
        totalInflow,
        totalOutflow,
        apiTxCount: txs.length
    }
}
