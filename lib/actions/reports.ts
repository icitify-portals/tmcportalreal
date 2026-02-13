"use server"

import { db } from "@/lib/db"
import {
    reports, reportTypeEnum, reportStatusEnum,
    organizations, offices, users
} from "@/lib/db/schema"
import { eq, and, desc, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { z } from "zod"

const DEFAULT_OFFICES = [
    "Ameer/Ameerah", "Secretariat", "Finance", "Dawah",
    "Education", "Social", "Welfare", "ICT", "Media"
]

export async function initializeDefaultOffices(organizationId: string) {
    try {
        const existing = await db.select().from(offices).where(eq(offices.organizationId, organizationId))
        if (existing.length > 0) return { success: true, message: "Offices already exist" }

        for (const name of DEFAULT_OFFICES) {
            await db.insert(offices).values({
                organizationId,
                name,
                description: `Default ${name} office`
            })
        }
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to initialize offices" }
    }
}

const ReportSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(['MONTHLY_ACTIVITY', 'QUARTERLY_STATE', 'ANNUAL_CONGRESS', 'FINANCIAL']),
    officeId: z.string().optional(),
    period: z.string().min(1, "Period is required"), // e.g. "2024-01"
    content: z.record(z.string(), z.any()), // JSON content
})

export async function submitReport(data: z.infer<typeof ReportSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = ReportSchema.parse(data)

        const [newReport] = await db.insert(reports).values({
            organizationId,
            userId: session.user.id,
            officeId: validData.officeId,
            type: validData.type,
            title: validData.title,
            period: validData.period,
            content: validData.content,
            status: 'SUBMITTED',
        }).$returningId()

        revalidatePath("/dashboard/reports")
        return { success: true, reportId: newReport.id }
    } catch (error) {
        console.error("Submit Report Error:", error)
        return { success: false, error: "Failed to submit report" }
    }
}

export async function getReports(filters: {
    organizationId?: string,
    type?: z.infer<typeof ReportSchema>['type'],
    status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
}) {
    try {
        const conditions = []
        if (filters.organizationId) conditions.push(eq(reports.organizationId, filters.organizationId))
        if (filters.type) conditions.push(eq(reports.type, filters.type))
        if (filters.status) conditions.push(eq(reports.status, filters.status))

        const results = await db.select({
            report: reports,
            user: users,
            office: offices,
            organization: organizations
        })
            .from(reports)
            .leftJoin(users, eq(reports.userId, users.id))
            .leftJoin(offices, eq(reports.officeId, offices.id))
            .leftJoin(organizations, eq(reports.organizationId, organizations.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(reports.createdAt))

        return results.map(r => ({
            ...r.report,
            user: r.user,
            office: r.office,
            organization: r.organization
        }))
    } catch (error) {
        console.error("Get Reports Error:", error)
        return []
    }
}

export async function approveReport(reportId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(reports).set({
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
        }).where(eq(reports.id, reportId))

        revalidatePath("/dashboard/reports")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

/**
 * Aggregates monthly reports into a quarterly or annual summary.
 * For example, collecting all Monthly Activity reports for a State to build a Quarterly report.
 */
export async function getAggregatedData(type: 'QUARTERLY' | 'ANNUAL', organizationId: string, year: number, quarter?: number) {
    try {
        // Find child organizations if applicable
        const childOrgs = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.parentId, organizationId))

        const orgIds = [organizationId, ...childOrgs.map(o => o.id)]

        let periodPrefix = `${year}`
        if (type === 'QUARTERLY' && quarter) {
            // This is a simplified example. In reality, you'd match specific months or quarters.
            periodPrefix = `${year}-Q${quarter}`
        }

        const results = await db.select({
            report: reports,
            office: offices
        })
            .from(reports)
            .leftJoin(offices, eq(reports.officeId, offices.id))
            .where(and(
                inArray(reports.organizationId, orgIds),
                eq(reports.status, 'APPROVED')
            ))

        return results.map(r => ({
            ...r.report,
            office: r.office
        }))
    } catch (error) {
        console.error("Aggregation Error:", error)
        return []
    }
}
