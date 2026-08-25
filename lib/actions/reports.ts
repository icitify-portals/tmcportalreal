"use server"

import { db } from "@/lib/db"
import {
    reports, reportTypeEnum, reportStatusEnum,
    organizations, offices, users
} from "@/lib/db/schema"
import { eq, and, desc, inArray, sql, like, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { z } from "zod"
import { offices as officesTable, organizations as orgsTable, officials as officialsTable } from "@/lib/db/schema"

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

        // Monthly office report: auto-bind office for officials if not supplied
        let officeId = validData.officeId || null
        if (!officeId && validData.type === 'MONTHLY_ACTIVITY') {
            const [off] = await db.select({ officeId: officialsTable.officeId }).from(officialsTable).where(eq(officialsTable.userId, session.user.id)).limit(1)
            if (off?.officeId) officeId = off.officeId
        }

        // Normalize period: YYYY-MM for monthly, YYYY-Qn for quarterly, YYYY for annual
        let period = validData.period.trim()
        if (validData.type === 'MONTHLY_ACTIVITY' && /^\d{4}-\d{2}$/.test(period) === false) {
            // allow YYYY-MM-DD input -> slice
            period = period.slice(0, 7)
        }

        // Prevent duplicate monthly submission for same office+period+org
        if (validData.type === 'MONTHLY_ACTIVITY' && officeId) {
            const [dup] = await db.select({ id: reports.id }).from(reports).where(and(
                eq(reports.organizationId, organizationId),
                eq(reports.officeId, officeId),
                eq(reports.type, 'MONTHLY_ACTIVITY'),
                eq(reports.period, period)
            )).limit(1)
            if (dup) return { success: false, error: `Monthly report for ${period} already submitted for this office` }
        }

        const [newReport] = await db.insert(reports).values({
            organizationId,
            userId: session.user.id,
            officeId,
            type: validData.type,
            title: validData.title,
            period,
            content: validData.content,
            status: 'SUBMITTED',
            updatedAt: new Date(),
        }).$returningId()

        revalidatePath("/dashboard/reports")
        revalidatePath("/dashboard/admin/reports")
        return { success: true, reportId: newReport.id }
    } catch (error: any) {
        console.error("Submit Report Error:", error)
        if (error?.issues) return { success: false, error: error.issues[0]?.message || "Validation failed" }
        return { success: false, error: "Failed to submit report" }
    }
}

export async function getReports(filters: {
    organizationId?: string,
    type?: z.infer<typeof ReportSchema>['type'],
    status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED',
    officeId?: string,
    period?: string,
    includeHierarchy?: boolean
}) {
    try {
        // Resolve hierarchy orgIds if requested
        let orgIds: string[] | null = null
        if (filters.organizationId && filters.includeHierarchy) {
            const all = await db.select({ id: orgsTable.id, parentId: orgsTable.parentId }).from(orgsTable)
            const map = new Map<string, string[]>()
            for (const o of all) {
                if (!o.parentId) continue
                if (!map.has(o.parentId)) map.set(o.parentId, [])
                map.get(o.parentId)!.push(o.id)
            }
            const queue = [filters.organizationId]
            const seen = new Set<string>()
            const collected: string[] = []
            while (queue.length) {
                const cur = queue.shift()!
                if (seen.has(cur)) continue
                seen.add(cur); collected.push(cur)
                ;(map.get(cur) ?? []).forEach(c => queue.push(c))
            }
            orgIds = collected
        }

        const conditions: any[] = []
        if (orgIds) conditions.push(inArray(reports.organizationId, orgIds))
        else if (filters.organizationId) conditions.push(eq(reports.organizationId, filters.organizationId))
        if (filters.type) conditions.push(eq(reports.type, filters.type))
        if (filters.status) conditions.push(eq(reports.status, filters.status))
        if (filters.officeId) conditions.push(eq(reports.officeId, filters.officeId))
        if (filters.period) conditions.push(eq(reports.period, filters.period))

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

export async function getMyOfficeReports(organizationId: string) {
    const session = await getServerSession()
    if (!session?.user?.id) return []
    const [off] = await db.select({ officeId: officialsTable.officeId }).from(officialsTable).where(eq(officialsTable.userId, session.user.id)).limit(1)
    if (!off?.officeId) return getReports({ organizationId, type: 'MONTHLY_ACTIVITY' })
    return getReports({ organizationId, type: 'MONTHLY_ACTIVITY', officeId: off.officeId })
}

export async function rejectReport(reportId: string, reason?: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }
        await db.update(reports).set({
            status: 'REJECTED',
            updatedAt: new Date(),
        } as any).where(eq(reports.id, reportId))
        revalidatePath("/dashboard/reports")
        revalidatePath("/dashboard/admin/reports")
        return { success: true }
    } catch (e) {
        return { success: false, error: "Reject failed" }
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
            updatedAt: new Date(),
        }).where(eq(reports.id, reportId))

        revalidatePath("/dashboard/reports")
        revalidatePath("/dashboard/admin/reports")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Approval failed" }
    }
}

export async function getOfficeRollup(params: {
    organizationId: string
    officeId?: string
    year: number
    quarter?: number // 1-4, if set -> quarterly else annual or monthly via period
    includeHierarchy?: boolean
}) {
    const months = params.quarter
        ? [(params.quarter-1)*3+1, (params.quarter-1)*3+2, (params.quarter-1)*3+3].map(m => `${params.year}-${String(m).padStart(2,'0')}`)
        : Array.from({length:12},(_,i)=> `${params.year}-${String(i+1).padStart(2,'0')}`)

    let orgIds: string[] | null = null
    if (params.includeHierarchy) {
        const all = await db.select({ id: orgsTable.id, parentId: orgsTable.parentId }).from(orgsTable)
        const map = new Map<string,string[]>()
        for (const o of all){ if(!o.parentId) continue; if(!map.has(o.parentId)) map.set(o.parentId,[]); map.get(o.parentId)!.push(o.id) }
        const q=[params.organizationId]; const seen=new Set<string>(); const col:string[]=[]
        while(q.length){ const cur=q.shift()!; if(seen.has(cur)) continue; seen.add(cur); col.push(cur); (map.get(cur)??[]).forEach(c=>q.push(c)) }
        orgIds = col
    }

    const conds:any[] = [inArray(reports.period, months), eq(reports.type,'MONTHLY_ACTIVITY')]
    if (orgIds) conds.push(inArray(reports.organizationId, orgIds))
    else conds.push(eq(reports.organizationId, params.organizationId))
    if (params.officeId) conds.push(eq(reports.officeId, params.officeId))

    const rows = await db.select({ report: reports, office: offices }).from(reports)
        .leftJoin(offices, eq(reports.officeId, offices.id))
        .where(and(...conds)).orderBy(asc(reports.period))

    const byPeriod = new Map<string, number>()
    for (const r of rows) byPeriod.set(r.report.period, (byPeriod.get(r.report.period)||0)+1)
    const byOffice = new Map<string, {name:string, count:number}>()
    for (const r of rows) {
        const key = r.report.officeId || '__none__'
        const name = r.office?.name || 'General'
        if (!byOffice.has(key)) byOffice.set(key,{name,count:0})
        byOffice.get(key)!.count++
    }

    return {
        months, rows: rows.map(r=>({ ...r.report, office:r.office })),
        total: rows.length,
        expected: params.quarter ? 3 : 12,
        coverage: Math.round((rows.length / (params.quarter ? 3 : 12)) * 100),
        byPeriod: Array.from(byPeriod.entries()).map(([period,count])=>({period,count})),
        byOffice: Array.from(byOffice.values()),
        approvedCount: rows.filter(r=>r.report.status==='APPROVED').length
    }
}

export async function generateQuarterlyReport(params: {
    organizationId: string
    officeId?: string
    year: number
    quarter: number
    title?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success:false, error:"Unauthorized" }
    const period = `${params.year}-Q${params.quarter}`
    // check duplicate
    const [dup] = await db.select({id:reports.id}).from(reports).where(and(
        eq(reports.organizationId, params.organizationId),
        eq(reports.type,'QUARTERLY_STATE'),
        eq(reports.period, period),
        ...(params.officeId ? [eq(reports.officeId, params.officeId)] : [])
    )).limit(1)
    if (dup) return { success:false, error:`Quarterly report for ${period} already exists` }

    const rollup = await getOfficeRollup({ organizationId: params.organizationId, officeId: params.officeId, year: params.year, quarter: params.quarter, includeHierarchy: !params.officeId })
    if (rollup.total===0) return { success:false, error:"No monthly reports found for this quarter" }

    const summary = `Quarterly rollup ${period}: ${rollup.total}/${rollup.expected} monthly reports (${rollup.coverage}% coverage).`
    const achievements = rollup.rows.map(r=>`- [${r.period}] ${r.title}: ${(r.content as any)?.summary || ''}`).join('\n')
    const challenges = rollup.rows.map(r=>`- [${r.period}] ${(r.content as any)?.challenges || ''}`).filter(Boolean).join('\n') || '—'

    const [created] = await db.insert(reports).values({
        organizationId: params.organizationId,
        userId: session.user.id,
        officeId: params.officeId || null,
        type: 'QUARTERLY_STATE',
        title: params.title || `Quarterly Report ${period}${params.officeId ? ` — ${rollup.byOffice[0]?.name || ''}` : ' — National'}`,
        period,
        content: {
            summary, achievements, challenges,
            stats: { total: rollup.total, expected: rollup.expected, coverage: rollup.coverage, byOffice: rollup.byOffice },
            sourcePeriods: rollup.rows.map(r=>r.period),
            sourceReportIds: rollup.rows.map(r=>r.id),
        },
        status: 'SUBMITTED',
        updatedAt: new Date(),
    }).$returningId()

    revalidatePath("/dashboard/admin/reports")
    return { success:true, reportId: created.id, stats: rollup }
}

export async function generateAnnualReport(params: {
    organizationId: string
    officeId?: string
    year: number
    title?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success:false, error:"Unauthorized" }
    const period = `${params.year}`
    const [dup] = await db.select({id:reports.id}).from(reports).where(and(
        eq(reports.organizationId, params.organizationId),
        eq(reports.type,'ANNUAL_CONGRESS'),
        eq(reports.period, period),
        ...(params.officeId ? [eq(reports.officeId, params.officeId)] : [])
    )).limit(1)
    if (dup) return { success:false, error:`Annual report for ${period} already exists` }

    const rollup = await getOfficeRollup({ organizationId: params.organizationId, officeId: params.officeId, year: params.year, includeHierarchy: !params.officeId })
    if (rollup.total===0) return { success:false, error:"No monthly reports found for this year" }

    const summary = `Annual rollup ${period}: ${rollup.total}/${rollup.expected} monthly reports (${rollup.coverage}% coverage).`

    const [created] = await db.insert(reports).values({
        organizationId: params.organizationId,
        userId: session.user.id,
        officeId: params.officeId || null,
        type: 'ANNUAL_CONGRESS',
        title: params.title || `Annual Report ${period}${params.officeId ? ` — ${rollup.byOffice[0]?.name || ''}` : ' — National'}`,
        period,
        content: {
            summary,
            achievements: rollup.rows.map(r=>`- [${r.period}] ${r.title}`).join('\n'),
            challenges: '—',
            stats: { total: rollup.total, expected: rollup.expected, coverage: rollup.coverage, byOffice: rollup.byOffice },
            sourcePeriods: rollup.rows.map(r=>r.period),
            sourceReportIds: rollup.rows.map(r=>r.id),
        },
        status: 'SUBMITTED',
        updatedAt: new Date(),
    }).$returningId()

    revalidatePath("/dashboard/admin/reports")
    return { success:true, reportId: created.id, stats: rollup }
}

/**
 * Aggregates monthly reports into a quarterly or annual summary.
 */
export async function getAggregatedData(type: 'QUARTERLY' | 'ANNUAL', organizationId: string, year: number, quarter?: number) {
    try {
        const all = await db.select({ id: orgsTable.id, parentId: orgsTable.parentId }).from(orgsTable)
        const map = new Map<string, string[]>()
        for (const o of all) { if (!o.parentId) continue; if (!map.has(o.parentId)) map.set(o.parentId, []); map.get(o.parentId)!.push(o.id) }
        const q = [organizationId]; const seen = new Set<string>(); const orgIds: string[] = []
        while (q.length) { const cur = q.shift()!; if (seen.has(cur)) continue; seen.add(cur); orgIds.push(cur); (map.get(cur) ?? []).forEach(c => q.push(c)) }

        const conditions: any[] = [inArray(reports.organizationId, orgIds), eq(reports.status, 'APPROVED')]
        if (type === 'QUARTERLY' && quarter) {
            const months = [(quarter-1)*3+1, (quarter-1)*3+2, (quarter-1)*3+3].map(m => `${year}-${String(m).padStart(2,'0')}`)
            conditions.push(inArray(reports.period, months))
        } else {
            conditions.push(like(reports.period, `${year}%`))
        }

        const results = await db.select({
            report: reports,
            office: offices
        })
            .from(reports)
            .leftJoin(offices, eq(reports.officeId, offices.id))
            .where(and(...conditions))
            .orderBy(asc(reports.period))

        return results.map(r => ({
            ...r.report,
            office: r.office
        }))
    } catch (error) {
        console.error("Aggregation Error:", error)
        return []
    }
}
