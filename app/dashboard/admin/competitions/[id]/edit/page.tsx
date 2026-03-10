"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCompetitionById, updateCompetition } from "@/lib/actions/competitions"
import type { CompetitionField } from "@/lib/actions/competitions"
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical, Award } from "lucide-react"
import Link from "next/link"

export default function EditCompetitionPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [year, setYear] = useState(new Date().getFullYear())
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [fields, setFields] = useState<CompetitionField[]>([])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!id) return

        async function fetchCompetition() {
            try {
                const comp = await getCompetitionById(id)
                if (comp) {
                    setTitle(comp.title)
                    setDescription(comp.description || "")
                    setYear(comp.year)
                    setStartDate(new Date(comp.startDate).toISOString().split('T')[0])
                    setEndDate(new Date(comp.endDate).toISOString().split('T')[0])

                    if (comp.fields && Array.isArray(comp.fields)) {
                        setFields(comp.fields as CompetitionField[])
                    }
                } else {
                    setError("Competition not found.")
                }
            } catch (err) {
                setError("Failed to load competition data.")
            } finally {
                setLoading(false)
            }
        }

        fetchCompetition()
    }, [id])

    const addField = () => {
        setFields(prev => [
            ...prev,
            {
                id: `field_${Date.now()}`,
                label: "",
                type: "text",
                required: false,
                placeholder: "",
            },
        ])
    }

    const removeField = (index: number) => {
        setFields(prev => prev.filter((_, i) => i !== index))
    }

    const updateField = (index: number, updates: Partial<CompetitionField>) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError("")

        // Validate fields have labels
        const emptyLabel = fields.find(f => !f.label.trim())
        if (emptyLabel) {
            setError("All fields must have labels.")
            setSubmitting(false)
            return
        }

        try {
            const result = await updateCompetition(id, {
                title,
                description,
                year,
                startDate,
                endDate,
                fields,
            })

            if (result.success) {
                router.push("/dashboard/admin/competitions")
                router.refresh()
            } else {
                setError(result.error || "Failed to update competition")
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <Link
                    href="/dashboard/admin/competitions"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Competitions
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="h-6 w-6 text-green-600" />
                    Edit Competition
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Update the details and questionnaire for this competition.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Basic Info */}
                <div className="bg-white rounded-xl border p-6 space-y-4">
                    <h2 className="font-semibold text-gray-800">Competition Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Opens *</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Closes *</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Fields Builder */}
                <div className="bg-white rounded-xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">Questionnaire Fields</h2>
                        <button
                            type="button"
                            onClick={addField}
                            className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                            <Plus className="h-4 w-4" /> Add Field
                        </button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, idx) => (
                            <div key={field.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="pt-2 text-gray-300">
                                    <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={e => updateField(idx, { label: e.target.value })}
                                        placeholder="Field Label"
                                        className="sm:col-span-5 rounded border border-gray-300 bg-white text-gray-900 px-2.5 py-1.5 text-sm focus:border-green-500 outline-none"
                                    />
                                    <select
                                        value={field.type}
                                        onChange={e => updateField(idx, { type: e.target.value as CompetitionField["type"] })}
                                        className="sm:col-span-3 rounded border border-gray-300 bg-white text-gray-900 px-2 py-1.5 text-sm focus:border-green-500 outline-none"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="number">Number</option>
                                        <option value="tel">Phone</option>
                                        <option value="date">Date</option>
                                        <option value="select">Dropdown</option>
                                        <option value="textarea">Paragraph</option>
                                    </select>
                                    <label className="sm:col-span-3 flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={e => updateField(idx, { required: e.target.checked })}
                                            className="rounded text-green-600"
                                        />
                                        Required
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeField(idx)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-0.5"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {fields.length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">
                            No fields added yet. Click &quot;Add Field&quot; to start building your questionnaire.
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/dashboard/admin/competitions"
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-700 border rounded-lg transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                    >
                        {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
