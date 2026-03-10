import { getCompetitions, deleteCompetition } from "@/lib/actions/competitions"
import Link from "next/link"
import { Award, Plus, Eye, Settings, Trash2, Users, Calendar, Building2 } from "lucide-react"
import { CompetitionActions } from "@/components/competitions/competition-actions"

export const dynamic = "force-dynamic"

export default async function AdminCompetitionsPage() {
    const competitions = await getCompetitions()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-green-600" />
                        Competitions
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage competitions, questionnaires, and view submissions.
                    </p>
                </div>
                <Link
                    href="/dashboard/admin/competitions/new"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                    <Plus className="h-4 w-4" />
                    New Competition
                </Link>
            </div>

            {/* List */}
            {competitions.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center">
                    <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Competitions Yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Create your first competition to start accepting applications.
                    </p>
                    <Link
                        href="/dashboard/admin/competitions/new"
                        className="inline-flex items-center gap-2 bg-green-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
                    >
                        <Plus className="h-4 w-4" /> Create Competition
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border sm:overflow-visible overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-left">
                                <th className="px-4 py-3 font-medium">Competition</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Organization</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Year</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">Deadline</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {competitions.map(comp => {
                                const endDate = new Date(comp.endDate)
                                const statusColor = comp.status === "ACTIVE"
                                    ? "bg-green-100 text-green-700"
                                    : comp.status === "CLOSED"
                                        ? "bg-red-100 text-red-700"
                                        : comp.status === "COMPLETED"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"

                                return (
                                    <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{comp.title}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                                            {comp.organizationName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                                            {comp.year}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                            {endDate.toLocaleDateString("en-NG", {
                                                day: "numeric", month: "short", year: "numeric"
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>
                                                {comp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/admin/competitions/${comp.id}/submissions`}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                    title="View Submissions"
                                                >
                                                    <Users className="h-4 w-4" />
                                                </Link>
                                                <CompetitionActions competitionId={comp.id} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
