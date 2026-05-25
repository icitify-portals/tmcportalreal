export const dynamic = 'force-dynamic'

import { getMyReviewAssignments } from "@/lib/actions/constitution"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FileText } from "lucide-react"
import { ReviewerDashboard } from "./reviewer-dashboard"

export default async function ConstitutionReviewerPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    const drafts = await getMyReviewAssignments() || []

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                            <FileText className="h-8 w-8 text-blue-700" />
                            Constitution Review
                        </h1>
                        <p className="text-muted-foreground font-medium">Review pending drafts and submit your observations.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <ReviewerDashboard drafts={drafts} />
                </div>
            </div>
        </DashboardLayout>
    )
}
