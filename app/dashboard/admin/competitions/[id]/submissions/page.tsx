import { getCompetitionById, getCompetitionSubmissions } from "@/lib/actions/competitions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Users, Award, Clock } from "lucide-react"
import { SubmissionsTable } from "@/components/competitions/submissions-table"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SubmissionsPage({ params }: PageProps) {
    const { id } = await params
    const competition = await getCompetitionById(id)
    if (!competition) return notFound()

    const submissions = await getCompetitionSubmissions(id)
    const fields = competition.fields as Array<{ id: string; label: string }>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/admin/competitions"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Competitions
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-green-600" />
                            Submissions
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {competition.title} &bull; {submissions.length} total submissions
                        </p>
                    </div>
                </div>
            </div>

            {/* Table with export */}
            <SubmissionsTable
                submissions={submissions}
                fields={fields}
                competitionTitle={competition.title}
            />
        </div>
    )
}
