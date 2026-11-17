import { getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { AsISeeItForm } from "@/components/programme/as-i-see-it-dialog"
import { ArrowLeft, Calendar, Utensils, Store } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function AsISeeItPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ reg?: string }>
}) {
    const { id } = await params
    const sp = await searchParams
    const registrationId = sp?.reg

    const [prog, session] = await Promise.all([
        getProgrammeCampDetails(id),
        getServerSession()
    ])

    if (!prog) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link 
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Event Schedule
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-amber-200 text-amber-800 hover:bg-amber-50">
                            <Link href={`/programmes/${id}/meals${registrationId ? `?reg=${registrationId}` : ''}`}>
                                <Utensils className="w-4 h-4 mr-1.5" /> Food Timetable
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-purple-200 text-purple-800 hover:bg-purple-50">
                            <Link href={`/programmes/${id}/vendors`}>
                                <Store className="w-4 h-4 mr-1.5" /> Camp Bazaar
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Observation Form */}
                <AsISeeItForm 
                    programmeId={id}
                    programmeTitle={prog.title}
                    registrationId={registrationId}
                    defaultSubmitterName={session?.user?.name || undefined}
                />
            </main>
        </div>
    )
}
