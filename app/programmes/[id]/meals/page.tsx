import { getProgrammeMealSchedules, getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { MealsView } from "@/components/programme/meals-view"
import { ArrowLeft, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function ProgrammeMealsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ reg?: string }>
}) {
    const { id } = await params
    const sp = await searchParams
    const registrationId = sp?.reg

    const [prog, mealsRes, session] = await Promise.all([
        getProgrammeCampDetails(id),
        getProgrammeMealSchedules(id),
        getServerSession()
    ])

    if (!prog) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link 
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Event Schedule
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                            <Link href={`/programmes/${id}/as-i-see-it${registrationId ? `?reg=${registrationId}` : ''}`}>
                                <Eye className="w-4 h-4 mr-1.5" /> As I See It Box
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Meals View */}
                <MealsView 
                    programmeId={id}
                    programmeTitle={prog.title}
                    meals={mealsRes.data as any}
                    registrationId={registrationId}
                    userInitialName={session?.user?.name || undefined}
                />
            </main>
        </div>
    )
}
