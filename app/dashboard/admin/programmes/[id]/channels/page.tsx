import { getServerSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OfficerChannelsWorkspace } from "@/components/programme/officer-channels-workspace"
import { getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminProgrammeChannelsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/auth/signin")

    const { id } = await params
    const prog = await getProgrammeCampDetails(id)
    if (!prog) return notFound()

    return (
        <DashboardLayout>
            <div className="space-y-5 max-w-7xl mx-auto pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/programmes/${id}/registrations`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Officer &amp; Zonal Channels</h1>
                                <Badge className="bg-emerald-700 text-white font-bold text-xs">Team Collaboration</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Structured departmental and zonal coordination rooms replacing fragmented WhatsApp groups for {prog.title}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/programmes/${id}/channels`} target="_blank">
                            <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> Field Officer Link
                            </Button>
                        </Link>
                    </div>
                </div>

                <OfficerChannelsWorkspace
                    programmeId={id}
                    programmeTitle={prog.title}
                    defaultSenderName={session.user.name || "Camp Officer"}
                    defaultSenderRole="Camp Directorate / Admin"
                    canPin={true}
                />
            </div>
        </DashboardLayout>
    )
}
