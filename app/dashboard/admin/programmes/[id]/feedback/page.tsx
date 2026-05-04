"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProgrammeFeedbackSummary, saveProgrammeFeedbackFields } from "@/lib/actions/programme-feedback"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical, Award, MessageSquare, Clipboard, CheckCircle2, BarChart2, Calendar, FileText, Send, Share2, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function ProgrammeFeedbackAdminPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [activeTab, setActiveTab] = useState<"design" | "analysis">("design")
    const [title, setTitle] = useState("")
    const [fields, setFields] = useState<any[]>([])
    const [submissions, setSubmissions] = useState<any[]>([])
    const [registrations, setRegistrations] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!id) return

        async function fetchFeedbackData() {
            try {
                const data = await getProgrammeFeedbackSummary(id)
                if (data) {
                    setTitle(data.programme.title)
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

                    if (data.submissions && Array.isArray(data.submissions)) {
                        setSubmissions(data.submissions)
                    }
                    if (data.registrations && Array.isArray(data.registrations)) {
                        setRegistrations(data.registrations)
                    }
                } else {
                    setError("Programme not found.")
                }
            } catch (err) {
                setError("Failed to load feedback data.")
            } finally {
                setLoading(false)
            }
        }

        fetchFeedbackData()
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

    const updateField = (index: number, updates: Partial<any>) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError("")

        const emptyLabel = fields.find(f => !f.label.trim())
        if (emptyLabel) {
            setError("All fields must have labels.")
            setSubmitting(false)
            return
        }

        try {
            const result = await saveProgrammeFeedbackFields(id, fields)
            if (result.success) {
                router.refresh()
            } else {
                setError(result.error || "Failed to update feedback fields.")
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setSubmitting(false)
        }
    }

    const copyFeedbackLink = () => {
        if (typeof window !== "undefined") {
            const link = `${window.location.origin}/programmes/${id}/feedback`
            navigator.clipboard.writeText(link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
                </div>
            </DashboardLayout>
        )
    }

    // --- Dynamic Advanced Analytics generation ---
    const positiveKeywords = ["good", "great", "excellent", "nice", "well", "amazing", "satisfied", "enjoyed", "best", "perfect", "clear", "informative"]
    const negativeKeywords = ["poor", "bad", "worst", "unclear", "dissatisfied", "disappointed", "slow", "hard", "difficult", "confusing", "failed"]

    const getSentiment = (text: string) => {
        if (!text) return "Neutral"
        const lowercase = text.toLowerCase()
        let score = 0
        positiveKeywords.forEach(word => {
            if (lowercase.includes(word)) score++
        })
        negativeKeywords.forEach(word => {
            if (lowercase.includes(word)) score--
        })
        if (score > 0) return "Positive"
        if (score < 0) return "Negative"
        return "Neutral"
    }

    const getAnalysis = () => {
        if (submissions.length === 0) return null

        const mappedSubmissions = submissions.map(sub => {
            const reg = registrations.find(r => r.userId === sub.userId)
            return {
                ...sub,
                gender: reg?.gender || "Guest / Unspecified",
                state: reg?.state || "Unspecified",
                branch: reg?.branch || "Unspecified",
                regStatus: reg?.status || "Guest"
            }
        })

        const analysisByField: Record<string, {
            label: string;
            type: string;
            answers: any[];
            counts?: Record<string, number>;
            npsScore?: number;
            sentimentCounts?: { Positive: number; Neutral: number; Negative: number };
            demographicsBreakdown?: Record<string, Record<string, number>>;
        }> = {}

        fields.forEach(field => {
            analysisByField[field.id] = {
                label: field.label,
                type: field.type,
                answers: [],
                counts: field.type === "select" ? {} : undefined,
                sentimentCounts: field.type === "textarea" ? { Positive: 0, Neutral: 0, Negative: 0 } : undefined,
                demographicsBreakdown: field.type === "select" ? {} : undefined
            }
        })

        mappedSubmissions.forEach(sub => {
            if (sub.data && typeof sub.data === "object") {
                Object.keys(sub.data).forEach(key => {
                    const value = sub.data[key]
                    if (analysisByField[key] && value !== undefined && value !== "") {
                        analysisByField[key].answers.push(value)
                        
                        // Count choices
                        if (analysisByField[key].counts) {
                            analysisByField[key].counts![value] = (analysisByField[key].counts![value] || 0) + 1
                        }

                        // Text sentiment classifying
                        if (analysisByField[key].sentimentCounts && typeof value === "string") {
                            const sentiment = getSentiment(value)
                            analysisByField[key].sentimentCounts![sentiment] = (analysisByField[key].sentimentCounts![sentiment] || 0) + 1
                        }

                        // Demographics cross-tabulation
                        if (analysisByField[key].demographicsBreakdown && sub.gender) {
                            const groupKey = `${sub.gender} (${sub.state})`
                            if (!analysisByField[key].demographicsBreakdown![groupKey]) {
                                analysisByField[key].demographicsBreakdown![groupKey] = {}
                            }
                            analysisByField[key].demographicsBreakdown![groupKey]![value] = (analysisByField[key].demographicsBreakdown![groupKey]![value] || 0) + 1
                        }
                    }
                })
            }
        })

        // Derive NPS Score for choice/rating dropdowns
        const promoterWords = ["excellent", "very satisfied", "extremely satisfied", "very good", "good", "satisfied", "5", "4"]
        const passiveWords = ["fair", "neutral", "average", "3"]
        const detractorWords = ["poor", "bad", "worst", "dissatisfied", "very dissatisfied", "2", "1"]

        Object.keys(analysisByField).forEach(key => {
            const ana = analysisByField[key]
            if (ana.type === "select" && ana.answers.length > 0) {
                let promoters = 0
                let passives = 0
                let detractors = 0

                ana.answers.forEach(ans => {
                    const val = ans.toString().toLowerCase()
                    if (promoterWords.some(w => val.includes(w))) promoters++
                    else if (detractorWords.some(w => val.includes(w))) detractors++
                    else passives++
                })

                const promoterPercent = (promoters / ana.answers.length) * 100
                const detractorPercent = (detractors / ana.answers.length) * 100
                ana.npsScore = Math.round(promoterPercent - detractorPercent)
            }
        })

        return analysisByField
    }

    const fieldAnalysis = getAnalysis()

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl p-4 md:p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            href={`/dashboard/admin/programmes/${id}/registrations`}
                            className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline mb-3"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Registrations
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <MessageSquare className="h-7 w-7 text-green-600" />
                            Programme Feedback & Analytics
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Customize questionnaire fields and view smart analysis for <span className="font-semibold text-gray-700">{title}</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            onClick={copyFeedbackLink}
                            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold px-4 py-2 text-sm rounded-lg transition-colors"
                        >
                            {copied ? (
                                <><CheckCircle2 className="h-4 w-4" /> Copied!</>
                            ) : (
                                <><Share2 className="h-4 w-4" /> Copy Shareable Form Link</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Tabs switcher */}
                <div className="flex border-b border-gray-200 gap-6">
                    <button
                        onClick={() => setActiveTab("design")}
                        className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors ${
                            activeTab === "design" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        📝 Feedback Form Design
                    </button>
                    <button
                        onClick={() => setActiveTab("analysis")}
                        className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors ${
                            activeTab === "analysis" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        📊 Smart Analysis ({submissions.length})
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {activeTab === "design" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-1">
                                    <Clipboard className="h-5 w-5 text-gray-500" />
                                    Questionnaire Fields Builder
                                </h2>
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-md hover:bg-green-100 font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Add Field
                                </button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, idx) => (
                                    <div key={field.id} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="pt-2 text-gray-300">
                                            <GripVertical className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                            <div className="sm:col-span-5">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(idx, { label: e.target.value })}
                                                    placeholder="Field Label (e.g. Rate your experience)"
                                                    className="w-full rounded border border-gray-300 bg-white text-gray-900 px-2.5 py-1.5 text-sm focus:border-green-500 outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <select
                                                    value={field.type}
                                                    onChange={e => updateField(idx, { type: e.target.value })}
                                                    className="w-full rounded border border-gray-300 bg-white text-gray-900 px-2 py-1.5 text-sm focus:border-green-500 outline-none"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="email">Email</option>
                                                    <option value="number">Number</option>
                                                    <option value="tel">Phone</option>
                                                    <option value="date">Date</option>
                                                    <option value="select">Dropdown (Multiple Choice)</option>
                                                    <option value="textarea">Long Text Paragraph</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-3 flex items-center gap-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-600 font-medium select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={e => updateField(idx, { required: e.target.checked })}
                                                        className="h-4 w-4 rounded text-green-600 border-gray-300 focus:ring-green-500/20"
                                                    />
                                                    Required
                                                </label>
                                            </div>

                                            {field.type === "select" && (
                                                <div className="sm:col-span-12 mt-2">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                        Dropdown Options (separated by commas)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={field.options?.join(", ") || ""}
                                                        onChange={e => updateField(idx, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                                        placeholder="Enter options separated by commas (e.g. Excellent, Good, Fair)"
                                                        className="w-full rounded border border-gray-300 bg-white text-gray-900 px-2.5 py-1.5 text-sm focus:border-green-500 outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeField(idx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {fields.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No fields added yet. Click &quot;Add Field&quot; to begin building your questionnaire.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors shadow"
                            >
                                {submitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving Changes…</>
                                ) : (
                                    "Save Feedback Form"
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "analysis" && (
                    <div className="space-y-6">
                        {submissions.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50">
                                <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <h3 className="font-semibold text-gray-800 text-base">No Feedback Yet</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                    No submissions have been received. Share the form link with participants to collect their feedback.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {/* Enhanced Analysis Panel */}
                                <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6">
                                    <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        <BarChart2 className="h-5 w-5 text-green-600" />
                                        Advanced Feedback Evaluation
                                    </h2>

                                    {fieldAnalysis && Object.keys(fieldAnalysis).map(fieldId => {
                                        const analysis = fieldAnalysis[fieldId]
                                        return (
                                            <div key={fieldId} className="p-4 bg-gray-50/50 rounded-lg border border-gray-100 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                                                    <h3 className="font-bold text-gray-800 text-base">
                                                        {analysis.label}
                                                    </h3>
                                                    <div className="flex items-center gap-2 select-none">
                                                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 border border-green-100 text-green-700 rounded">
                                                            {analysis.answers.length} responses
                                                        </span>
                                                        {analysis.npsScore !== undefined && (
                                                            <span className={`text-xs font-semibold px-2 py-1 border rounded ${
                                                                analysis.npsScore >= 30 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                                                analysis.npsScore >= 0 ? "bg-amber-50 border-amber-100 text-amber-700" :
                                                                "bg-red-50 border-red-100 text-red-700"
                                                            }`}>
                                                                NPS Score: {analysis.npsScore}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Text Sentiment breakdown */}
                                                {analysis.type === "textarea" && analysis.sentimentCounts && (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {Object.keys(analysis.sentimentCounts).map(sentKey => {
                                                            const count = (analysis.sentimentCounts as any)[sentKey]
                                                            const percent = analysis.answers.length ? Math.round((count / analysis.answers.length) * 100) : 0
                                                            return (
                                                                <div key={sentKey} className="bg-white p-3 rounded-lg border border-gray-100 flex flex-col items-center">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase">{sentKey}</span>
                                                                    <span className="text-lg font-bold text-gray-800 mt-1">{count}</span>
                                                                    <span className="text-xs text-gray-400">{percent}%</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                {/* Choices bars & Demographics Cross-Tabulation */}
                                                {analysis.type === "select" && analysis.counts ? (
                                                    <div className="space-y-4">
                                                        <div className="space-y-3">
                                                            {Object.keys(analysis.counts).map(option => {
                                                                const count = analysis.counts![option] || 0
                                                                const percent = analysis.answers.length ? Math.round((count / analysis.answers.length) * 100) : 0
                                                                return (
                                                                    <div key={option} className="space-y-1">
                                                                        <div className="flex justify-between text-sm font-medium text-gray-700">
                                                                            <span>{option}</span>
                                                                            <span>{count} ({percent}%)</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="bg-green-600 h-2.5 rounded-full"
                                                                                style={{ width: `${percent}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        {/* Demographics crosstab breakdown section */}
                                                        {analysis.demographicsBreakdown && Object.keys(analysis.demographicsBreakdown).length > 0 && (
                                                            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                                                                <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                                                                    <Users className="h-4 w-4 text-gray-500" />
                                                                    Demographics Breakdown (Gender & State)
                                                                </h4>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-xs text-left text-gray-500 border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                                                <th className="px-3 py-2 text-gray-700 font-bold">Demographic Layer</th>
                                                                                {Object.keys(analysis.counts).map(opt => (
                                                                                    <th key={opt} className="px-3 py-2 text-gray-700 font-bold text-right">{opt}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-50">
                                                                            {Object.keys(analysis.demographicsBreakdown).map(demoKey => {
                                                                                const counts = analysis.demographicsBreakdown![demoKey] || {}
                                                                                return (
                                                                                    <tr key={demoKey} className="hover:bg-gray-50/60 transition-colors">
                                                                                        <td className="px-3 py-2 font-medium text-gray-800">{demoKey}</td>
                                                                                        {Object.keys(analysis.counts!).map(opt => (
                                                                                            <td key={opt} className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                                                {counts[opt] || 0}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                                        {analysis.answers.length > 0 ? (
                                                            analysis.answers.map((ans, idx) => (
                                                                <div key={idx} className="text-sm bg-white p-3 border rounded-lg text-gray-700 flex flex-col justify-between gap-1">
                                                                    <div>{ans}</div>
                                                                    {analysis.type === "textarea" && (
                                                                        <div className="flex justify-end select-none">
                                                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                                                                getSentiment(ans) === "Positive" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                                                                                getSentiment(ans) === "Negative" ? "bg-red-50 text-red-700 border border-red-200/50" :
                                                                                "bg-gray-50 text-gray-700 border border-gray-200/50"
                                                                            }`}>
                                                                                {getSentiment(ans)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-sm text-gray-400 italic">No responses provided.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
