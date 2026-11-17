"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
    Award, 
    ArrowLeft, 
    Star, 
    CheckCircle2, 
    ShieldCheck, 
    Building2, 
    Send, 
    Sparkles, 
    ThumbsUp, 
    AlertCircle 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getProgrammeDepartments, submitDepartmentAssessment } from "@/lib/actions/programme-camp-ops"

export default function DelegateDepartmentAssessmentPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const id = params.id as string
    const registrationId = searchParams.get("reg") || ""

    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDeptId, setSelectedDeptId] = useState("")

    // Ratings 1 to 5
    const [overallRating, setOverallRating] = useState(5)
    const [efficiencyRating, setEfficiencyRating] = useState(5)
    const [serviceRating, setServiceRating] = useState(5)
    const [conductRating, setConductRating] = useState(5)

    const [commendation, setCommendation] = useState("")
    const [areasOfImprovement, setAreasOfImprovement] = useState("")
    const [evaluatorName, setEvaluatorName] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submittedDeptName, setSubmittedDeptName] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const res = await getProgrammeDepartments(id)
            if (res.success && res.data.length > 0) {
                setDepartments(res.data)
                setSelectedDeptId(res.data[0].id)
            }
            setLoading(false)
        }
        if (id) load()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDeptId) {
            toast.error("Please select a department to assess")
            return
        }

        setIsSubmitting(true)
        const chosenDept = departments.find(d => d.id === selectedDeptId)

        const res = await submitDepartmentAssessment({
            programmeId: id,
            departmentId: selectedDeptId,
            registrationId: registrationId || undefined,
            evaluatorName: isAnonymous ? "Anonymous Delegate" : evaluatorName,
            overallRating,
            efficiencyRating,
            serviceRating,
            conductRating,
            commendation,
            areasOfImprovement,
        })

        if (res.success) {
            toast.success(`Thank you! Your assessment for ${chosenDept?.name || 'department'} has been submitted.`)
            setSubmittedDeptName(chosenDept?.name || "Department")
            // Reset feedback
            setCommendation("")
            setAreasOfImprovement("")
        } else {
            toast.error(res.error || "Failed to submit assessment")
        }
        setIsSubmitting(false)
    }

    const renderStarSelector = (value: number, onChange: (val: number) => void, label: string, desc: string) => (
        <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {value} / 5
                </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        type="button"
                        key={star}
                        onClick={() => onChange(star)}
                        className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                    >
                        <Star 
                            className={`w-6 h-6 ${
                                star <= value 
                                    ? "text-amber-400 fill-amber-400 drop-shadow-2xs" 
                                    : "text-gray-300"
                            }`} 
                        />
                    </button>
                ))}
            </div>
        </div>
    )

    const selectedDept = departments.find(d => d.id === selectedDeptId)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link 
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Camp Schedule
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/programmes/${id}/meals${registrationId ? `?reg=${registrationId}` : ''}`}
                            className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs"
                        >
                            Food Timetable
                        </Link>
                        <Link 
                            href={`/programmes/${id}/as-i-see-it${registrationId ? `?reg=${registrationId}` : ''}`}
                            className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs"
                        >
                            "As I See It"
                        </Link>
                    </div>
                </div>

                {/* Banner */}
                <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
                    <div className="space-y-2">
                        <Badge className="bg-white/20 text-white border-none font-bold text-xs uppercase tracking-wider">
                            Camp Quality Assurance & Accountability
                        </Badge>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Departmental KPI Assessment
                        </h1>
                        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                            Evaluate the operational performance of camp directorates and committees. Your honest assessment helps leadership grade departmental efficiency and reward service excellence.
                        </p>
                    </div>
                </div>

                {/* Success Banner */}
                {submittedDeptName && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="text-xs">
                                <span className="font-bold">Assessment Recorded for {submittedDeptName}!</span> You can select another department below to rate other directorates.
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSubmittedDeptName(null)}
                            className="text-emerald-700 text-xs font-bold h-7"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Form Card */}
                <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400">
                                Loading camp departments...
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Department Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-gray-600">
                                        Select Department / Directorate to Assess *
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {departments.map(d => {
                                            const isSelected = selectedDeptId === d.id
                                            return (
                                                <button
                                                    type="button"
                                                    key={d.id}
                                                    onClick={() => setSelectedDeptId(d.id)}
                                                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                                        isSelected 
                                                            ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20" 
                                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                                                            {d.name}
                                                        </span>
                                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                                            {d.code}
                                                        </span>
                                                    </div>
                                                    {d.description && (
                                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{d.description}</p>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Active Department Banner */}
                                {selectedDept && (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Assessing: {selectedDept.name}</p>
                                            <p className="text-[11px] text-gray-500">{selectedDept.description}</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                            4 KPI Dimensions
                                        </Badge>
                                    </div>
                                )}

                                {/* KPI Ratings Grid */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-gray-600">
                                        Performance Ratings (1 = Poor, 5 = Excellent)
                                    </Label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {renderStarSelector(
                                            overallRating, 
                                            setOverallRating, 
                                            "1. Overall Effectiveness", 
                                            "General satisfaction with delivery"
                                        )}
                                        {renderStarSelector(
                                            efficiencyRating, 
                                            setEfficiencyRating, 
                                            "2. Punctuality & Readiness", 
                                            "Speed, adherence to time, readiness"
                                        )}
                                        {renderStarSelector(
                                            serviceRating, 
                                            setServiceRating, 
                                            "3. Service Quality", 
                                            "Excellence of execution and output"
                                        )}
                                        {renderStarSelector(
                                            conductRating, 
                                            setConductRating, 
                                            "4. Courteousness & Demeanour", 
                                            "Polite conduct and patient interaction"
                                        )}
                                    </div>
                                </div>

                                {/* Commendation / Area for Improvement */}
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> Commendations & Strengths
                                        </Label>
                                        <Textarea 
                                            value={commendation}
                                            onChange={(e) => setCommendation(e.target.value)}
                                            placeholder="What did this department do exceptionally well that should be commended?"
                                            rows={2}
                                            className="text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Areas of Improvement / Constructive Advice
                                        </Label>
                                        <Textarea 
                                            value={areasOfImprovement}
                                            onChange={(e) => setAreasOfImprovement(e.target.value)}
                                            placeholder="What bottlenecks, delays, or issues did you observe? How can they improve next time?"
                                            rows={2}
                                            className="text-xs rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Evaluator Identity & Anonymous Toggle */}
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1 w-full sm:w-auto">
                                        <Label className="text-xs font-bold text-gray-700">Your Name (Optional)</Label>
                                        <Input 
                                            disabled={isAnonymous}
                                            value={evaluatorName}
                                            onChange={(e) => setEvaluatorName(e.target.value)}
                                            placeholder={isAnonymous ? "Anonymous Delegate" : "e.g. Bro. Luqman"}
                                            className="h-8 text-xs rounded-xl mt-1"
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer pt-3 sm:pt-0">
                                        <input 
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                        />
                                        <span className="text-xs font-bold text-gray-700">Submit Anonymously</span>
                                    </label>
                                </div>

                                <Button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-11 rounded-2xl text-xs gap-2 shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? "Submitting Evaluation..." : "Submit Departmental Assessment"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
