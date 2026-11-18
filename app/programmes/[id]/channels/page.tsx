import { getServerSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { OfficerChannelsWorkspace } from "@/components/programme/officer-channels-workspace"
import { getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Megaphone, Tv } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PublicOfficerChannelsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [prog, session] = await Promise.all([
        getProgrammeCampDetails(id),
        getServerSession(),
    ])

    if (!prog) return notFound()

    const isAdmin = !!(
        session?.user?.isSuperAdmin ||
        session?.user?.roles?.some((r: any) => r.code === "ADMIN" || r.jurisdictionLevel !== "MEMBER") ||
        session?.user?.officialId
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                    <Link
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Event Schedule
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/announcements`}>
                                <Megaphone className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Broadcasts
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                            <Link href={`/programmes/${id}/virtual`}>
                                <Tv className="w-3.5 h-3.5 mr-1 text-blue-600" /> Virtual Hub
                            </Link>
                        </Button>
                    </div>
                </div>

                <OfficerChannelsWorkspace
                    programmeId={id}
                    programmeTitle={prog.title}
                    defaultSenderName={session?.user?.name || ""}
                    defaultSenderRole="Field / Zonal Officer"
                    canPin={isAdmin}
                />
            </main>
        </div>
    )
}
