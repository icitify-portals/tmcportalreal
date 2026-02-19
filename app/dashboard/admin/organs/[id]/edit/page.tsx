export const dynamic = 'force-dynamic'

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { organs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { OrganForm } from "../../organ-form"

interface EditOrganPageProps {
    params: { id: string }
}

export default async function EditOrganPage({ params }: EditOrganPageProps) {
    const organ = await db.query.organs.findFirst({
        where: eq(organs.id, params.id),
    })

    if (!organ) notFound()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/organs">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-primary" />
                            Edit Organ
                        </h1>
                        <p className="text-sm text-muted-foreground">Updating: <strong>{organ.name}</strong></p>
                    </div>
                </div>

                <OrganForm mode="edit" initialData={organ} />
            </div>
        </DashboardLayout>
    )
}
