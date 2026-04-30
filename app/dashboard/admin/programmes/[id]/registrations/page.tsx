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
import { Download, Printer, UserCheck, ShieldCheck, QrCode, Monitor, Layout } from "lucide-react"
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
import { programmes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

async function RegistrationsTable({ programmeId }: { programmeId: string }) {
    const registrations = await getProgrammeRegistrations(programmeId)

    if (registrations.length === 0) {
        return (
            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                <p className="text-muted-foreground font-medium">No registrations yet for this programme.</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="w-[50px] font-bold text-gray-700 uppercase text-[11px] tracking-widest">S/N</TableHead>
                        <TableHead className="w-[120px] font-bold text-gray-700 uppercase text-[11px] tracking-widest">Mem. ID</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Name/Email</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Phone</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Type</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Payment</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Check-In</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Check-Out</TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-[11px] tracking-widest">Status</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 uppercase text-[11px] tracking-widest">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {registrations.map((reg, index) => (
                        <TableRow key={reg.id} className="hover:bg-gray-50/80 transition-colors border-b last:border-0">
                            <TableCell className="py-4 text-gray-500 font-medium text-xs">{index + 1}</TableCell>
                            <TableCell className="py-4 text-black font-semibold uppercase text-xs tracking-wider">{reg.member?.memberId || 'Guest'}</TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 text-sm">{reg.name}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{reg.email}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-black font-medium text-sm">{reg.phone || 'N/A'}</TableCell>
                            <TableCell className="py-4">
                                <Badge variant={reg.userId ? "outline" : "secondary"} className="font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5">
                                    {reg.userId ? "Member" : "Guest"}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                                <ClientCurrency amount={parseFloat(reg.amountPaid || "0")} className="font-bold text-black text-sm" />
                            </TableCell>
                            <TableCell className="py-4">
                                {reg.checkInTime ? (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-green-700 text-sm">{format(new Date(reg.checkInTime), "HH:mm")}</span>
                                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">By: {reg.checkInBy || 'Self'}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-200">—</span>
                                )}
                            </TableCell>
                            <TableCell className="py-4">
                                {reg.checkOutTime ? (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-amber-700 text-sm">{format(new Date(reg.checkOutTime), "HH:mm")}</span>
                                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">By: {reg.checkOutBy || 'Self'}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-200">—</span>
                                )}
                            </TableCell>
                            <TableCell className="py-4">
                                <Badge variant={reg.status === 'PAID' || reg.status === 'ATTENDED' ? 'default' : 'secondary'} className="font-black uppercase tracking-tighter text-[9px] px-2 py-0.5">
                                    {reg.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50" asChild title="Print Access Slip">
                                        <Link href={`/programmes/registrations/${reg.id}/slip`} target="_blank">
                                            <Printer className="h-4 w-4 text-blue-600" />
                                        </Link>
                                    </Button>
                                    {(reg.status === 'PAID' || reg.status === 'REGISTERED' || reg.status === 'ATTENDED') && (
                                        <MarkAttendanceButton registrationId={reg.id} status={reg.status} userName={reg.name} />
                                    )}
                                    <DeleteRegistrationButton registrationId={reg.id} userName={reg.name} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default async function ProgrammeRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) redirect("/dashboard/admin/programmes")

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
                    </div>
                    <div className="flex items-center gap-2">
                        <Suspense fallback={<Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Export CSV</Button>}>
                            <RegistrationsHeader programmeId={id} programmeTitle={programme.title} />
                        </Suspense>
                    </div>
                </div>

                <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg border" />}>
                    <RegistrationsTable programmeId={id} />
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
            <SyncPaymentsButton programmeId={programmeId} />
            <SendCertificatesButton programmeId={programmeId} />
            <ClearRegistrationsButton programmeId={programmeId} programmeTitle={programmeTitle} />
        </div>
    )
}
