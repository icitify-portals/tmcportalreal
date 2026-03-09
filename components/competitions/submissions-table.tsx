"use client"

import { useState } from "react"
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Field {
    id: string
    label: string
}

interface Submission {
    id: string
    data: unknown
    status: string | null
    submittedAt: Date | null
}

interface Props {
    submissions: Submission[]
    fields: Field[]
    competitionTitle: string
}

export function SubmissionsTable({ submissions, fields, competitionTitle }: Props) {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(0)
    const perPage = 20

    // Filter by search across all field values
    const filtered = submissions.filter(sub => {
        if (!search) return true
        const data = sub.data as Record<string, string>
        return Object.values(data).some(v =>
            String(v).toLowerCase().includes(search.toLowerCase())
        )
    })

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

    const handleExportCSV = () => {
        // Build CSV
        const headers = ["S/N", ...fields.map(f => f.label), "Status", "Submitted At"]
        const rows = filtered.map((sub, idx) => {
            const data = sub.data as Record<string, string>
            return [
                idx + 1,
                ...fields.map(f => `"${(data[f.id] || "").replace(/"/g, '""')}"`),
                sub.status || "",
                sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("en-NG") : "",
            ].join(",")
        })

        const csv = [headers.join(","), ...rows].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${competitionTitle.replace(/\s+/g, "_")}_submissions.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search submissions…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0) }}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                    />
                </div>
                <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-left">
                            <th className="px-4 py-3 font-medium w-12">S/N</th>
                            {fields.slice(0, 5).map(f => (
                                <th key={f.id} className="px-4 py-3 font-medium">{f.label}</th>
                            ))}
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={fields.length + 3} className="px-4 py-8 text-center text-gray-400">
                                    No submissions found.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((sub, idx) => {
                                const data = sub.data as Record<string, string>
                                return (
                                    <tr key={sub.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500">{page * perPage + idx + 1}</td>
                                        {fields.slice(0, 5).map(f => (
                                            <td key={f.id} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                                                {data[f.id] || "—"}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {sub.submittedAt
                                                ? new Date(sub.submittedAt).toLocaleDateString("en-NG", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })
                                                : "—"
                                            }
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
                    <span>
                        Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
