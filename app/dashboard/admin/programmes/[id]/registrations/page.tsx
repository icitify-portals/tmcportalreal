import { Suspense } from "react"
import { getProgrammeRegistrations, getRegistrationDetails } from "@/lib/actions/programmes"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Printer, UserCheck, ShieldCheck, QrCode, Monitor, Layout, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ClientDate } from "@/components/ui/client-date"
import { ClientCurrency } from "@/components/ui/client-currency"
import { ExportRegistrationsCSV } from "@/components/admin/programmes/export-csv"
import { MarkAttendanceButton } from "@/components/admin/programmes/mark-attendance-button"
import { DeleteRegistrationButton } from "@/components/admin/programmes/delete-registration-button"
import { ClearRegistrationsButton } from "@/components/admin/programmes/clear-registrations-button"
import { SyncPaymentsButton } from "@/components/admin/programmes/sync-payments-button"
import { ResetAttendanceButton } from "@/components/admin/programmes/reset-attendance-button"
import { SendCertificatesButton } from "@/components/admin/programmes/send-certificates-button"
import { db } from "@/lib/db"
import { programmes, programmeMaterials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { RegistrationsClientTable } from "@/components/admin/programmes/registrations-client-table"

export const dynamic = "force-dynamic"

async function RegistrationsList({ programmeId, programmeAmount }: { programmeId: string, programmeAmount: string | null }) {
    const registrations = await getProgrammeRegistrations(programmeId)

    if (registrations.length === 0) {
        return (
            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                <p className="text-muted-foreground font-medium">No registrations yet for this programme.</p>
            </div>
        )
    }

    return <RegistrationsClientTable registrations={registrations} programmeId={programmeId} programmeAmount={programmeAmount} />
}

export default async function ProgrammeRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) redirect("/dashboard/admin/programmes")

    let materials: any[] = []
    try {
        materials = await db.select().from(programmeMaterials).where(eq(programmeMaterials.programmeId, id))
    } catch (error) {
        console.error("[Materials Query Error] Table or database missing:", error)
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/dashboard/admin/programmes" className="text-sm text-green-700 hover:underline">
                                Programmes
                            </Link>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-sm font-medium">Registrations</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{programme.title}</h2>
                        <p className="text-muted-foreground">
                            Manage and track attendees for this programme.
                        </p>
                        {materials && materials.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-xs font-bold uppercase text-gray-400 self-center">Attached Documents:</span>
                                {materials.map((mat) => (
                                    <a key={mat.id} href={mat.url} target="_blank" className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                                        📥 {mat.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Suspense fallback={<Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Export CSV</Button>}>
                            <RegistrationsHeader programmeId={id} programmeTitle={programme.title} />
                        </Suspense>
                    </div>
                </div>

                <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg border" />}>
                    <RegistrationsList programmeId={id} programmeAmount={programme.amount} />
                </Suspense>
            </div>
        </DashboardLayout>
    )
}

async function RegistrationsHeader({ programmeId, programmeTitle }: { programmeId: string, programmeTitle: string }) {
    const registrations = await getProgrammeRegistrations(programmeId)
    return (
        <div className="flex items-center gap-2">
            <ExportRegistrationsCSV data={registrations} programmeTitle={programmeTitle} />
            <Button variant="outline" className="h-9 border-green-200 text-green-700 hover:bg-green-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programmeId}/verify`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Verify Entry
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programmeId}/kiosk`} target="_blank">
                    <Monitor className="mr-2 h-4 w-4" />
                    Launch Kiosk
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programmeId}/poster`} target="_blank">
                    <Layout className="mr-2 h-4 w-4" />
                    Print Poster
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-purple-200 text-purple-700 hover:bg-purple-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programmeId}/feedback`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feedback
                </Link>
            </Button>
            <SyncPaymentsButton programmeId={programmeId} />
            <SendCertificatesButton programmeId={programmeId} />
            <ClearRegistrationsButton programmeId={programmeId} programmeTitle={programmeTitle} />
        </div>
    )
}
