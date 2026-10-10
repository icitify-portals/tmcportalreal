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

    // Sort scored submissions first by percentage desc, then date desc
    const sorted = [...submissions].sort((a, b) => {
        const dataA = a.data as Record<string, any>
        const dataB = b.data as Record<string, any>
        const scoreA = dataA?._percentage !== undefined ? Number(dataA._percentage) : -1
        const scoreB = dataB?._percentage !== undefined ? Number(dataB._percentage) : -1
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    })

    // Filter by search across all field values
    const filtered = sorted.filter(sub => {
        if (!search) return true
        const data = sub.data as Record<string, any>
        return Object.values(data).some(v =>
            String(v).toLowerCase().includes(search.toLowerCase())
        )
    })

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

    const handleExportCSV = () => {
        // Build CSV
        const headers = ["Rank", "S/N", ...fields.map(f => f.label), "Score", "Percentage", "Status", "Submitted At"]
        const rows = filtered.map((sub, idx) => {
            const data = sub.data as Record<string, any>
            const scoreStr = data._score !== undefined ? `${data._score}/${data._totalPoints}` : "—"
            const pctStr = data._percentage !== undefined ? `${data._percentage}%` : "—"
            return [
                idx + 1,
                idx + 1,
                ...fields.map(f => `"${String(data[f.id] || "").replace(/"/g, '""')}"`),
                scoreStr,
                pctStr,
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
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b bg-muted/20">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search submissions (min. 2-3 chars)…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0) }}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                    />
                </div>
                <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <Download className="h-4 w-4" /> Export CSV Leaderboard
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-left">
                            <th className="px-4 py-3 font-medium w-16">Rank</th>
                            {fields.slice(0, 4).map(f => (
                                <th key={f.id} className="px-4 py-3 font-medium">{f.label}</th>
                            ))}
                            <th className="px-4 py-3 font-medium text-center">Score / Grade</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={fields.length + 4} className="px-4 py-8 text-center text-gray-400">
                                    No submissions found.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((sub, idx) => {
                                const data = sub.data as Record<string, any>
                                const rank = page * perPage + idx + 1
                                const hasScore = data._percentage !== undefined

                                return (
                                    <tr key={sub.id} className={`hover:bg-gray-50 ${rank <= 3 && hasScore ? "bg-amber-50/40" : ""}`}>
                                        <td className="px-4 py-3 font-bold text-gray-700">
                                            {rank === 1 && hasScore ? (
                                                <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold">🥇 1st</span>
                                            ) : rank === 2 && hasScore ? (
                                                <span className="inline-flex items-center gap-1 text-gray-500 font-extrabold">🥈 2nd</span>
                                            ) : rank === 3 && hasScore ? (
                                                <span className="inline-flex items-center gap-1 text-amber-700 font-extrabold">🥉 3rd</span>
                                            ) : (
                                                `#${rank}`
                                            )}
                                        </td>
                                        {fields.slice(0, 4).map(f => (
                                            <td key={f.id} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                                                {String(data[f.id] || "—")}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center">
                                            {hasScore ? (
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-extrabold text-emerald-700">{data._score} / {data._totalPoints}</span>
                                                    <span className="text-[11px] text-muted-foreground font-semibold">{data._percentage}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
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
