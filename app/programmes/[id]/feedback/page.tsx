"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getProgrammeFeedbackSummary, submitProgrammeFeedback } from "@/lib/actions/programme-feedback"
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck, Send } from "lucide-react"

export default function ProgrammeFeedbackPublicPage() {
    const params = useParams()
    const id = params.id as string

    const [programme, setProgramme] = useState<any>(null)
    const [fields, setFields] = useState<any[]>([])
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!id) return

        async function fetchForm() {
            try {
                const data = await getProgrammeFeedbackSummary(id)
                if (data && data.programme) {
                    setProgramme(data.programme)
                    if (data.programme.feedbackFields && Array.isArray(data.programme.feedbackFields)) {
                        setFields(data.programme.feedbackFields)
                    } else {
                        // Set up defaults if none are configured yet
                        setFields([
                            { id: "field_1", label: "1. Level in The Muslim Congress", type: "select", required: true, options: ["Branch Officer", "Local Government Officer", "State Officer", "National Officer"] },
                            { id: "field_2", label: "2. Mode of Participation", type: "select", required: true, options: ["Physically (On-site)", "Virtually (Online)"] },
                            { id: "field_3", label: "3. Venue rating (1-5)", type: "select", required: false, options: ["5", "4", "3", "2", "1"] },
                            { id: "field_4", label: "4. Was the venue conducive?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_5", label: "5. Food rating (1-5)", type: "select", required: false, options: ["5", "4", "3", "2", "1"] },
                            { id: "field_6", label: "6. Was food sufficient and well-timed?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_7", label: "7. Was the online experience effective?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_8", label: "8. Was audio/video quality satisfactory?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_9", label: "9. Lecturers & topics rating (1-5)", type: "select", required: false, options: ["5", "4", "3", "2", "1"] },
                            { id: "field_10", label: "10. Were the sessions engaging?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_11", label: "11. Did you have enough opportunity to participate?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_12", label: "12. Overall organisation rating (1-5)", type: "select", required: false, options: ["5", "4", "3", "2", "1"] },
                            { id: "field_13", label: "13. Was the schedule convenient?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_14", label: "14. Overall satisfaction (1-5)", type: "select", required: false, options: ["5", "4", "3", "2", "1"] },
                            { id: "field_15", label: "15. Would you recommend this workshop?", type: "select", required: false, options: ["Yes", "No"] },
                            { id: "field_16", label: "16. Key takeaway / suggestions", type: "textarea", required: false }
                        ])
                    }
                } else {
                    setError("Form not found or programme is unavailable.")
                }
            } catch {
                setError("Failed to load feedback form.")
            } finally {
                setLoading(false)
            }
        }

        fetchForm()
    }, [id])

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError("")

        // Basic validation
        for (const field of fields) {
            if (field.required && (!formData[field.id] || formData[field.id].toString().trim() === "")) {
                setError(`The field "${field.label}" is required.`)
                setSubmitting(false)
                return
            }
        }

        try {
            const res = await submitProgrammeFeedback(id, formData)
            if (res.success) {
                setSuccess(true)
            } else {
                setError(res.error || "An error occurred while submitting your feedback.")
            }
        } catch {
            setError("Failed to submit. Please check your internet connection.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-2" />
                <p className="text-gray-500 font-medium text-sm animate-pulse">Loading feedback form...</p>
            </div>
        )
    }

    if (error && !programme) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white p-6 rounded-2xl border border-red-200 text-center max-w-sm w-full shadow-lg">
                    <p className="text-red-600 font-semibold mb-3">{error}</p>
                    <a href="/" className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition-colors">
                        Go Home
                    </a>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white p-8 rounded-2xl border border-green-200 text-center max-w-md w-full shadow-lg space-y-4">
                    <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-green-100 animate-bounce">
                        <CheckCircle2 className="h-9 w-9 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
                    <p className="text-gray-600 font-medium text-sm">
                        Your feedback for <span className="text-gray-800 font-semibold">{programme?.title}</span> has been successfully submitted. We appreciate your time and comments.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4 md:p-8">
            <div className="max-w-xl w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                {/* Visual Accent Bar */}
                <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-full" />

                <div className="p-6 md:p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto border border-green-100 mb-2">
                            <MessageSquare className="h-7 w-7 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Programme Feedback
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {programme?.title}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl select-none">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {fields.map(field => {
                            const value = formData[field.id] || ""
                            return (
                                <div key={field.id} className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                    </label>

                                    {field.type === "textarea" ? (
                                        <textarea
                                            value={value}
                                            onChange={e => handleInputChange(field.id, e.target.value)}
                                            rows={3}
                                            required={field.required}
                                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3.5 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none resize-none transition-all"
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            value={value}
                                            onChange={e => handleInputChange(field.id, e.target.value)}
                                            required={field.required}
                                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3.5 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none transition-all select-none"
                                        >
                                            <option value="">Select an option...</option>
                                            {field.options && field.options.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={value}
                                            onChange={e => handleInputChange(field.id, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder || ""}
                                            className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3.5 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none transition-all"
                                        />
                                    )}
                                </div>
                            )
                        })}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-green-500/10 cursor-pointer select-none"
                            >
                                {submitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                                ) : (
                                    <><Send className="h-4 w-4" /> Submit Feedback</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
