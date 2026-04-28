import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { QRScanner } from "@/components/admin/programmes/qr-scanner"
import { db } from "@/lib/db"
import { programmes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VerifyEntryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) redirect("/dashboard/admin/programmes")

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/admin/programmes/${id}/registrations`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Verify Entry</h2>
                        <p className="text-muted-foreground">
                            {programme.title}
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg border" />}>
                        <QRScanner programmeId={id} />
                    </Suspense>
                </div>
            </div>
        </DashboardLayout>
    )
}
