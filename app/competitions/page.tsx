import { getActiveCompetitions, getCompetitionById } from "@/lib/actions/competitions"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Award, Calendar, Clock, ArrowLeft, MapPin } from "lucide-react"
import { CompetitionApplicationForm } from "@/components/competitions/application-form"

export const dynamic = "force-dynamic"

export default async function CompetitionsPage() {
    const activeCompetitions = await getActiveCompetitions()

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white">
                <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                        <Award className="h-4 w-4" />
                        TMC Competitions
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Competitions & Events
                    </h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto">
                        Apply for ongoing competitions organised by The Muslim Congress.
                        Register early to secure your spot!
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                {activeCompetitions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                        <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            No Active Competitions
                        </h2>
                        <p className="text-gray-500">
                            There are no competitions accepting applications at this time.
                            Please check back later.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 mt-6 text-green-600 hover:text-green-700 font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {activeCompetitions.map((competition) => {
                            const endDate = new Date(competition.endDate)
                            const now = new Date()
                            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                            const isExpiringSoon = daysLeft <= 7 && daysLeft > 0

                            return (
                                <div key={competition.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                        <Award className="h-3 w-3" />
                                                        Open for Registration
                                                    </span>
                                                    {isExpiringSoon && (
                                                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                            <Clock className="h-3 w-3" />
                                                            {daysLeft} days left
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {competition.title}
                                                </h2>
                                                {competition.description && (
                                                    <p className="text-gray-600 mb-4 line-clamp-2">{competition.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4 text-green-600" />
                                                        {competition.organizationName}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4 text-green-600" />
                                                        Deadline: {endDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/competitions/${competition.id}/apply`}
                                                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0"
                                            >
                                                Apply Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
