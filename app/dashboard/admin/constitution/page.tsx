export const dynamic = 'force-dynamic'

import { getConstitutionDrafts } from "@/lib/actions/constitution"
import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"
import { ConstitutionManager } from "./constitution-manager"

export default async function ConstitutionAdminPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return notFound()

    const drafts = await getConstitutionDrafts() || []

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                            <FileText className="h-8 w-8 text-green-700" />
                            Constitution Committee Workspace
                        </h1>
                        <p className="text-muted-foreground font-medium">Review, draft, and collaborate on the constitution document.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <ConstitutionManager drafts={drafts} />
                </div>
            </div>
        </DashboardLayout>
    )
}
