import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { programmes, organizations } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"
import { MonthlySubmissionClient } from "@/components/admin/programmes/monthly-submission-client"

export const dynamic = 'force-dynamic'

export default async function MonthlySubmissionMonitorPage() {
    const session = await getServerSession()
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.level !== 'NATIONAL')) {
        redirect("/dashboard")
    }

    // Get programmes from beginning of this year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    const allProgrammes = await db.select({
        programme: programmes,
        organization: organizations
    })
    .from(programmes)
    .leftJoin(organizations, eq(programmes.organizationId, organizations.id))
    .where(gte(programmes.startDate, startOfYear))
    .orderBy(desc(programmes.startDate))

    // Serialize data
    const serializedProgrammes = allProgrammes.map(p => ({
        id: p.programme.id,
        title: p.programme.title,
        startDate: p.programme.startDate.toISOString(),
        endDate: p.programme.endDate ? p.programme.endDate.toISOString() : null,
        status: p.programme.status || "DRAFT",
        venue: p.programme.venue || "TBA",
        targetAudience: p.programme.targetAudience || "PUBLIC",
        organizationName: p.organization?.name || "Unknown",
        organizationLevel: p.organization?.level || "Unknown",
        jurisdiction: p.organization?.state ? (p.organization?.city ? `${p.organization.city}, ${p.organization.state}` : p.organization.state) : "National",
    }))

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-green-900">Programme Submissions Monitor</h2>
                    <p className="text-muted-foreground">Monitor monthly submissions, upcoming programmes, and detect date clashes.</p>
                </div>
            </div>
            
            <MonthlySubmissionClient initialProgrammes={serializedProgrammes} />
        </div>
    )
}
