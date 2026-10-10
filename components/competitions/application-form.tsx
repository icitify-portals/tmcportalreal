"use client"

import { useState } from "react"
import { submitCompetitionApplication } from "@/lib/actions/competitions"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface FormField {
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    options?: string[]
}

interface Props {
    competitionId: string
    fields: FormField[]
}

export function CompetitionApplicationForm({ competitionId, fields }: Props) {
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [scoreInfo, setScoreInfo] = useState<{ score?: number; totalPoints?: number; percentage?: number } | null>(null)

    const handleChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError("")

        // Validate required fields
        for (const field of fields) {
            if (field.required && !formData[field.id]?.trim()) {
                setError(`"${field.label}" is required.`)
                setSubmitting(false)
                return
            }
        }

        try {
            const result = await submitCompetitionApplication(competitionId, formData)
            if (result.success) {
                setScoreInfo({
                    score: result.score,
                    totalPoints: result.totalPoints,
                    percentage: result.percentage,
                })
                setSuccess(true)
            } else {
                setError(result.error || "Failed to submit application.")
            }
        } catch {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">Application Submitted!</h3>
                {scoreInfo?.percentage !== undefined ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 max-w-sm mx-auto shadow-sm">
                        <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Your Score</span>
                        <div className="text-4xl font-extrabold text-emerald-950 my-1">
                            {scoreInfo.score} / {scoreInfo.totalPoints}
                        </div>
                        <div className="text-sm font-semibold text-emerald-700">
                            {scoreInfo.percentage}% Grade
                        </div>
                    </div>
                ) : null}
                <p className="text-gray-500 max-w-md mx-auto text-sm">
                    Your answers and application details have been recorded successfully. Jazakumullahu Khayran!
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {fields.map(field => (
                <div key={field.id}>
                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>

                    {field.type === "select" ? (
                        <select
                            id={field.id}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            required={field.required}
                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                        >
                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                            {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : field.type === "textarea" ? (
                        <textarea
                            id={field.id}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            required={field.required}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
                        />
                    ) : (
                        <input
                            id={field.id}
                            type={field.type}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            required={field.required}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                        />
                    )}
                </div>
            ))}

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                        </>
                    ) : (
                        "Submit Application"
                    )}
                </button>
            </div>
        </form>
    )
}
