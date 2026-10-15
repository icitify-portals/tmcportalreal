import { db } from "@/lib/db"
import { programmes, programmeRegistrations, members, users, programmeSponsorshipPools } from "@/lib/db/schema"
import { eq, desc, and, or, sql, inArray } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProgrammeAnalyticsView } from "@/components/admin/programmes/programme-analytics-view"

export default async function ProgrammeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) return notFound()

    const isPaidProgramme = programme.paymentRequired && parseFloat(programme.amount || "0") > 0
    let whereCondition: any = eq(programmeRegistrations.programmeId, id)
    if (isPaidProgramme) {
        whereCondition = and(
            eq(programmeRegistrations.programmeId, id),
            or(
                sql`CAST(${programmeRegistrations.amountPaid} AS DECIMAL(10,2)) > 0`,
                inArray(programmeRegistrations.status, ['PAID', 'PARTIALLY_PAID', 'ATTENDED']),
                eq(programmeRegistrations.checkInWaiver, true),
                eq(programmeRegistrations.paymentReference, 'ADMIN_OFFLINE_BYPASS')
            )
        )
    }

    const registrations = await db.select({
        id: programmeRegistrations.id,
        name: programmeRegistrations.name,
        email: programmeRegistrations.email,
        phone: programmeRegistrations.phone,
        gender: programmeRegistrations.gender,
        state: programmeRegistrations.state,
        lga: programmeRegistrations.lga,
        branch: programmeRegistrations.branch,
        status: programmeRegistrations.status,
        amountPaid: programmeRegistrations.amountPaid,
        checkInTime: programmeRegistrations.checkInTime,
        bulkGroupId: programmeRegistrations.bulkGroupId,
        sponsorPoolId: programmeRegistrations.sponsorPoolId,
    })
    .from(programmeRegistrations)
    .where(whereCondition)

    const sponsorshipPools = await db.select().from(programmeSponsorshipPools)
        .where(eq(programmeSponsorshipPools.programmeId, id))
        .orderBy(desc(programmeSponsorshipPools.createdAt))

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
                <ProgrammeAnalyticsView
                    programmeTitle={programme.title}
                    programmeStartDate={programme.startDate}
                    registrations={registrations as any}
                    sponsorshipPools={sponsorshipPools as any}
                />
            </div>
        </DashboardLayout>
    )
}
