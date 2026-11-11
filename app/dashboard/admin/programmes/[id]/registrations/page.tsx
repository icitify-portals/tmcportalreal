import { Suspense } from "react"
import { getProgrammeRegistrations } from "@/lib/actions/programmes"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Download, 
    Printer, 
    UserCheck, 
    ShieldCheck, 
    QrCode, 
    Monitor, 
    Layout, 
    MessageSquare, 
    BarChart3, 
    Share2, 
    Users,
    Sparkles,
    ExternalLink,
    Receipt
} from "lucide-react"
import Link from "next/link"
import { ExportRegistrationsCSV } from "@/components/admin/programmes/export-csv"
import { ClearRegistrationsButton } from "@/components/admin/programmes/clear-registrations-button"
import { SyncPaymentsButton } from "@/components/admin/programmes/sync-payments-button"
import { SendCertificatesButton } from "@/components/admin/programmes/send-certificates-button"
import { db } from "@/lib/db"
import { programmes, programmeMaterials, programmeSponsorshipPools, bulkRegistrationGroups } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { redirect } from "next/navigation"

import { RegistrationsClientTable } from "@/components/admin/programmes/registrations-client-table"
import { AddParticipantsDialog } from "@/components/admin/programmes/add-participants-dialog"
import { ShareProgrammeDialog } from "@/components/programmes/share-programme-dialog"
import { ProgrammeShareTab } from "@/components/admin/programmes/programme-share-tab"
import { ProgrammeFinanceTab } from "@/components/admin/programmes/programme-finance-tab"

export const dynamic = "force-dynamic"

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

    const registrations = await getProgrammeRegistrations(id)

    let sponsorshipPools: any[] = []
    try {
        sponsorshipPools = await db.select().from(programmeSponsorshipPools)
            .where(eq(programmeSponsorshipPools.programmeId, id))
            .orderBy(desc(programmeSponsorshipPools.createdAt))
    } catch (e) {
        console.error("Sponsorship pools query error:", e)
    }

    let bulkGroups: any[] = []
    try {
        bulkGroups = await db.select().from(bulkRegistrationGroups)
            .where(eq(bulkRegistrationGroups.programmeId, id))
            .orderBy(desc(bulkRegistrationGroups.createdAt))
    } catch (e) {
        console.error("Bulk groups query error:", e)
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/dashboard/admin/programmes" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                                Programmes
                            </Link>
                            <span className="text-slate-400">/</span>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Registrations</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{programme.title}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                            Manage attendees, inspect complete financial collections, and share registration links.
                        </p>
                        {materials && materials.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-xs font-bold uppercase text-slate-500 self-center">Attached Documents:</span>
                                {materials.map((mat) => (
                                    <a key={mat.id} href={mat.url} target="_blank" className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                                        📥 {mat.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <RegistrationsHeader programme={programme} registrations={registrations} />
                    </div>
                </div>

                {/* Tabs for Registration Menu */}
                <Tabs defaultValue="registrations" className="space-y-4">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-xs">
                        <TabsTrigger 
                            value="registrations" 
                            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 data-[state=active]:bg-emerald-700 data-[state=active]:text-white shadow-xs py-2 px-3.5 rounded-lg transition-all"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Registrations ({registrations.length})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="financial-audit" 
                            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 data-[state=active]:bg-emerald-700 data-[state=active]:text-white shadow-xs py-2 px-3.5 rounded-lg transition-all"
                        >
                            <Receipt className="h-4 w-4 mr-2 text-emerald-600 data-[state=active]:text-white" />
                            Financial Audit & Collections
                        </TabsTrigger>
                        <TabsTrigger 
                            value="shareable-link" 
                            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 data-[state=active]:bg-emerald-700 data-[state=active]:text-white shadow-xs py-2 px-3.5 rounded-lg transition-all"
                        >
                            <Share2 className="h-4 w-4 mr-2 text-emerald-600 data-[state=active]:text-white" />
                            Shareable Registration Link & Publicity
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Registrations Table */}
                    <TabsContent value="registrations" className="space-y-4">
                        {/* Quick Share Banner inside Registrations view */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-xs sm:text-sm">
                                    <strong className="text-emerald-950 dark:text-white font-bold">Direct Registration Link:</strong> Share this specific link with invitees so they can register directly without searching through other programmes.
                                </span>
                            </div>
                            <ShareProgrammeDialog
                                programme={programme}
                                buttonVariant="default"
                                buttonSize="sm"
                                className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 shadow-xs"
                            />
                        </div>

                        {registrations.length === 0 ? (
                            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                                <p className="text-muted-foreground font-medium">No registrations yet for this programme.</p>
                                <div className="mt-4 flex items-center justify-center gap-3">
                                    <AddParticipantsDialog programmeId={id} programmeTitle={programme.title} />
                                    <ShareProgrammeDialog
                                        programme={programme}
                                        buttonVariant="default"
                                        buttonSize="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    />
                                </div>
                            </div>
                        ) : (
                            <RegistrationsClientTable 
                                registrations={registrations} 
                                programmeId={id} 
                                programmeTitle={programme.title} 
                                programmeAmount={programme.amount} 
                            />
                        )}
                    </TabsContent>

                    {/* Tab 2: Financial Audit & Collections */}
                    <TabsContent value="financial-audit" className="space-y-4">
                        <ProgrammeFinanceTab 
                            programmeId={programme.id}
                            programmeTitle={programme.title}
                            programmeAmount={programme.amount}
                            registrations={registrations}
                            sponsorshipPools={sponsorshipPools}
                            bulkGroups={bulkGroups}
                        />
                    </TabsContent>

                    {/* Tab 3: Shareable Registration Link & Publicity */}
                    <TabsContent value="shareable-link" className="space-y-4">
                        <ProgrammeShareTab programme={programme} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

function RegistrationsHeader({ programme, registrations }: { programme: any, registrations: any[] }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <ShareProgrammeDialog
                programme={programme}
                buttonVariant="outline"
                className="h-9 border-emerald-600 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
            />
            <ExportRegistrationsCSV data={registrations} programmeTitle={programme.title} />
            <Button variant="outline" className="h-9 border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold shadow-sm" asChild>
                <Link href={`/dashboard/admin/programmes/${programme.id}/analytics`}>
                    <BarChart3 className="mr-2 h-4 w-4 text-emerald-700" />
                    Level Analytics
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-green-200 text-green-700 hover:bg-green-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programme.id}/verify`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Verify Entry
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programme.id}/kiosk`} target="_blank">
                    <Monitor className="mr-2 h-4 w-4" />
                    Launch Kiosk
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programme.id}/poster`} target="_blank">
                    <Layout className="mr-2 h-4 w-4" />
                    Print Poster
                </Link>
            </Button>
            <Button variant="outline" className="h-9 border-purple-200 text-purple-700 hover:bg-purple-50" asChild>
                <Link href={`/dashboard/admin/programmes/${programme.id}/feedback`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feedback
                </Link>
            </Button>
            <SyncPaymentsButton programmeId={programme.id} />
            <SendCertificatesButton programmeId={programme.id} />
            <ClearRegistrationsButton programmeId={programme.id} programmeTitle={programme.title} />
        </div>
    )
}
