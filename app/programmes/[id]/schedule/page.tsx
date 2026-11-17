import { getProgrammeScheduleTimeline } from "@/lib/actions/programme-camp-ops"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { ScheduleTimeline } from "@/components/programme/schedule-timeline"
import { Calendar, ArrowLeft, Download, Utensils, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function ProgrammeSchedulePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const res = await getProgrammeScheduleTimeline(id)

    if (!res.success || !res.programme) {
        return notFound()
    }

    const { programme, schedules } = res

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Back / Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link 
                        href={`/programmes/${id}/register`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Programme
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-amber-200 text-amber-800 hover:bg-amber-50">
                            <Link href={`/programmes/${id}/meals`}>
                                <Utensils className="w-4 h-4 mr-1.5" /> Food Timetable
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                            <Link href={`/programmes/${id}/as-i-see-it`}>
                                <Eye className="w-4 h-4 mr-1.5" /> As I See It
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Programme Header */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Official Programme Timetable & Agenda</p>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{programme.title}</h1>
                    <p className="text-sm text-gray-500 font-medium">{programme.venue}</p>
                </div>

                {/* Timeline Component */}
                <ScheduleTimeline 
                    programmeTitle={programme.title}
                    programmeVenue={programme.venue}
                    nextActionTicker={programme.nextActionTicker}
                    schedules={schedules as any}
                />
            </main>
        </div>
    )
}
