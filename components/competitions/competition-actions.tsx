"use client"

import { useState } from "react"
import { updateCompetition, deleteCompetition } from "@/lib/actions/competitions"
import { MoreHorizontal, Trash2, Pause, Play, CheckCircle, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Props {
    competitionId: string
}

export function CompetitionActions({ competitionId }: Props) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleStatusChange = async (status: string) => {
        setLoading(true)
        await updateCompetition(competitionId, { status })
        setOpen(false)
        setLoading(false)
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will delete the competition and all its submissions.")) return
        setLoading(true)
        await deleteCompetition(competitionId)
        setOpen(false)
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                disabled={loading}
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-lg shadow-lg z-50 py-1 text-sm">
                        <Link
                            href={`/dashboard/admin/competitions/${competitionId}/edit`}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700 text-left"
                            onClick={() => setOpen(false)}
                        >
                            <Edit className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <button
                            onClick={() => handleStatusChange("ACTIVE")}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 text-gray-700"
                        >
                            <Play className="h-3.5 w-3.5 text-green-600" /> Set Active
                        </button>
                        <button
                            onClick={() => handleStatusChange("CLOSED")}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50 text-gray-700"
                        >
                            <Pause className="h-3.5 w-3.5 text-amber-600" /> Close Registration
                        </button>
                        <button
                            onClick={() => handleStatusChange("COMPLETED")}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-gray-700"
                        >
                            <CheckCircle className="h-3.5 w-3.5 text-blue-600" /> Mark Completed
                        </button>
                        <div className="border-t my-1" />
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
