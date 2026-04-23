import { getCompetitionById } from "@/lib/actions/competitions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Award, ArrowLeft, Calendar, MapPin, Clock } from "lucide-react"
import { CompetitionApplicationForm } from "@/components/competitions/application-form"
import { PublicNav } from "@/components/layout/public-nav"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ApplyPage({ params }: PageProps) {
    const { id } = await params
    const competition = await getCompetitionById(id)

    if (!competition) return notFound()

    // Check if still accepting applications
    const isActive = competition.status === "ACTIVE"
    const isPastDeadline = new Date() > new Date(competition.endDate)
    const canApply = isActive && !isPastDeadline

    const fields = competition.fields as Array<{
        id: string
        label: string
        type: string
        required: boolean
        placeholder?: string
        options?: string[]
    }>

    const endDate = new Date(competition.endDate)
    const startDate = new Date(competition.startDate)

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <PublicNav />
            {/* Hero */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Link
                        href="/competitions"
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Applications
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-sm px-3 py-1 rounded-full">
                            <Award className="h-3.5 w-3.5" />
                            {competition.year} Application
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        {competition.title}
                    </h1>
                    {competition.description && (
                        <p className="text-white/80 text-lg max-w-3xl">{competition.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/70">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {competition.organizationName}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {startDate.toLocaleDateString("en-NG", { day: "numeric", month: "short" })} –{" "}
                            {endDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto px-4 py-10">
                {!canApply ? (
                    <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
                        <Clock className="h-12 w-12 mx-auto text-red-400 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Registration Closed
                        </h2>
                        <p className="text-gray-500">
                            {isPastDeadline
                                ? "The deadline for this competition has passed."
                                : "This competition is no longer accepting applications."}
                        </p>
                        <Link
                            href="/competitions"
                            className="inline-flex items-center gap-2 mt-4 text-green-600 hover:text-green-700 font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" /> View Other Applications
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b bg-green-50/50">
                            <h2 className="text-lg font-semibold text-gray-800">Application Form</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Fill out all required fields and submit your application.
                            </p>
                        </div>
                        <div className="p-6">
                            <CompetitionApplicationForm
                                competitionId={competition.id}
                                fields={fields}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
