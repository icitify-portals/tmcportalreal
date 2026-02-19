export const dynamic = 'force-dynamic'

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { tmcProgrammes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import { TmcProgrammeForm } from "../../tmc-programme-form"

interface EditTmcProgrammePageProps {
    params: { id: string }
}

export default async function EditTmcProgrammePage({ params }: EditTmcProgrammePageProps) {
    const programme = await db.query.tmcProgrammes.findFirst({
        where: eq(tmcProgrammes.id, params.id),
    })
    if (!programme) notFound()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/tmc-programmes">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Edit Programme
                        </h1>
                        <p className="text-sm text-muted-foreground">Updating: <strong>{programme.title}</strong></p>
                    </div>
                </div>
                <TmcProgrammeForm mode="edit" initialData={programme} />
            </div>
        </DashboardLayout>
    )
}
