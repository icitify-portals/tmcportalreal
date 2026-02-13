export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TeskiyahForm } from "@/components/admin/teskiyah/teskiyah-form"

export default async function NewTeskiyahCentrePage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const { id } = await searchParams
    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/admin/teskiyah">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-xl font-semibold tracking-tight">{id ? "Edit" : "Add New"} Teskiyah Centre</h2>
                </div>
                <TeskiyahForm editId={id} />
            </div>
        </DashboardLayout>
    )
}
