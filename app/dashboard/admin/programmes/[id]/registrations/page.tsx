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
import { Download, Printer, UserCheck, ShieldCheck, QrCode } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ClientDate } from "@/components/ui/client-date"
import { ClientCurrency } from "@/components/ui/client-currency"
import { ExportRegistrationsCSV } from "@/components/admin/programmes/export-csv"
import { MarkAttendanceButton } from "@/components/admin/programmes/mark-attendance-button"
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
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500">Attendee</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500">Type</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500">Payment</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500">Status</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500">Date</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider text-gray-500 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {registrations.map((reg) => (
                        <TableRow key={reg.id} className="hover:bg-gray-50/50">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">{reg.name}</span>
                                    <span className="text-xs text-muted-foreground">{reg.email}</span>
                                    {reg.member?.membershipId && (
                                        <span className="text-[10px] font-mono text-green-700 bg-green-50 px-1 rounded w-fit mt-1">
                                            {reg.member.membershipId}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={reg.userId ? "outline" : "secondary"} className="text-[10px]">
                                    {reg.userId ? "Member" : "Guest"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <ClientCurrency amount={parseFloat(reg.amountPaid || "0")} className="font-medium text-sm" />
                                    {reg.paymentReference && (
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                            Ref: {reg.paymentReference}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    reg.status === 'PAID' ? 'default' :
                                    reg.status === 'ATTENDED' ? 'secondary' :
                                    reg.status === 'REGISTERED' ? 'outline' : 'destructive'
                                } className="text-[10px]">
                                    {reg.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                                <ClientDate date={reg.registeredAt} formatString="MMM d, yyyy" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="Print Access Slip">
                                        <Link href={`/programmes/registrations/${reg.id}/slip`} target="_blank">
                                            <Printer className="h-4 w-4 text-blue-600" />
                                        </Link>
                                    </Button>
                                    {(reg.status === 'PAID' || reg.status === 'REGISTERED' || reg.status === 'ATTENDED') && (
                                        <MarkAttendanceButton registrationId={reg.id} status={reg.status} />
                                    )}
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
        </div>
    )
}
