"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
    MessageSquarePlus, 
    Send, 
    ShieldAlert, 
    Sparkles, 
    CheckCircle2, 
    Eye, 
    Loader2, 
    HelpCircle,
    HeartHandshake,
    AlertTriangle
} from "lucide-react"
import { submitCampObservation } from "@/lib/actions/programme-camp-ops"
import { toast } from "sonner"

interface AsISeeItDialogProps {
    programmeId: string
    programmeTitle: string
    registrationId?: string
    defaultSubmitterName?: string
}

const CATEGORIES = [
    { value: "SANITATION", label: "🚽 Sanitation & Bathrooms", desc: "Water supply, cleanliness, toilet hygiene" },
    { value: "SECURITY", label: "🛡️ Security & Marshals", desc: "Gate control, night patrols, orderliness" },
    { value: "WELFARE", label: "🍲 Welfare & Food", desc: "Food quality, serving speed, drinking water" },
    { value: "ACCOMMODATION", label: "🛏️ Hostels & Sleeping", desc: "Ventilation, space, mattresses, power" },
    { value: "LECTURES", label: "📖 Lectures & Da'wah", desc: "Speakers, audio audibility, lecture timing" },
    { value: "AUDIO_VISUAL", label: "🔊 Sound & Media", desc: "Microphones, projector, live streaming" },
    { value: "MEDICAL", label: "🏥 Health & Medical", desc: "Clinic response, first aid, emergency" },
    { value: "GENERAL", label: "💡 General Observation", desc: "Leadership, atmosphere, general feedback" },
]

export function AsISeeItForm({
    programmeId,
    programmeTitle,
    registrationId,
    defaultSubmitterName
}: AsISeeItDialogProps) {
    const [category, setCategory] = useState("WELFARE")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [urgency, setUrgency] = useState("MEDIUM")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [submitterName, setSubmitterName] = useState(defaultSubmitterName || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !description.trim()) {
            toast.error("Please provide both a summary title and detailed description.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await submitCampObservation({
                programmeId,
                registrationId,
                category,
                title: title.trim(),
                description: description.trim(),
                urgency,
                isAnonymous,
                submitterName: isAnonymous ? undefined : submitterName.trim(),
            })

            if (res.success) {
                toast.success("Your observation has been submitted directly to Camp Leadership.")
                setIsSuccess(true)
                setTitle("")
                setDescription("")
            } else {
                toast.error(res.error || "Failed to submit observation")
            }
        } catch (err) {
            toast.error("An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="border-2 border-emerald-500 bg-white shadow-xl rounded-3xl p-6 sm:p-10 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Observation Received!</h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                        Jazakumullahu Khayran. Your feedback has been safely logged in the Camp Leadership Dashboard. 
                        Critical matters will be escalated immediately, and general observations will be reviewed by the Leadership on the final day.
                    </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 italic max-w-md mx-auto">
                    “The believer is the mirror of his brother. If he sees any fault in him, he rectifies it.” — Hadith
                </div>

                <Button 
                    onClick={() => setIsSuccess(false)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-6"
                >
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Submit Another Observation
                </Button>
            </Card>
        )
    }

    return (
        <Card className="border border-gray-200 bg-white shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-800 text-white p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
                        Live Camp Voice
                    </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">
                    AS I SEE IT (Camp Observation Box)
                </CardTitle>
                <CardDescription className="text-emerald-100 text-sm mt-1">
                    Help make {programmeTitle} better. Share what you observe on ground—complaints, praises, safety issues, or suggestions.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Category Selector Grid */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            1. Select Department / Area of Observation
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`p-3 rounded-2xl border text-left transition-all ${
                                        category === cat.value
                                            ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500 shadow-xs"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white"
                                    }`}
                                >
                                    <p className="text-sm font-bold text-gray-900">{cat.label}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{cat.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Urgency Level */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            2. Urgency Level
                        </Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {[
                                { val: "LOW", label: "Low (General Suggestion)", color: "text-gray-700 border-gray-200 hover:bg-gray-50" },
                                { val: "MEDIUM", label: "Medium (Needs Attention)", color: "text-amber-800 border-amber-200 bg-amber-50/40" },
                                { val: "URGENT", label: "Urgent (Action Required ASAP)", color: "text-rose-800 border-rose-200 bg-rose-50" },
                            ].map(u => (
                                <Button
                                    key={u.val}
                                    type="button"
                                    size="sm"
                                    variant={urgency === u.val ? "default" : "outline"}
                                    onClick={() => setUrgency(u.val)}
                                    className={`rounded-xl text-xs font-bold ${
                                        urgency === u.val 
                                            ? (u.val === "URGENT" ? "bg-rose-700 text-white" : "bg-emerald-700 text-white") 
                                            : u.color
                                    }`}
                                >
                                    {u.val === "URGENT" && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-300 animate-bounce" />}
                                    {u.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="obs-title" className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            3. Subject / Brief Summary
                        </Label>
                        <Input 
                            id="obs-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Water pump issue in Hostel Block B, or Kudos to Welfare on breakfast"
                            className="h-11 rounded-xl text-sm font-medium"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="obs-desc" className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            4. Detailed Observation & Recommendations
                        </Label>
                        <Textarea 
                            id="obs-desc"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you noticed, where, when, and how you think it can be improved..."
                            className="rounded-xl text-sm"
                            required
                        />
                    </div>

                    {/* Identity Option */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Submit Anonymously?</p>
                                <p className="text-[11px] text-gray-500">Your name will not be visible to camp leadership.</p>
                            </div>
                            <input 
                                type="checkbox"
                                id="anon"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                            />
                        </div>

                        {!isAnonymous && (
                            <div className="pt-2 border-t border-gray-200">
                                <Label htmlFor="sub-name" className="text-xs font-bold text-gray-700">Your Name / Delegation (Optional)</Label>
                                <Input 
                                    id="sub-name"
                                    value={submitterName}
                                    onChange={(e) => setSubmitterName(e.target.value)}
                                    placeholder="e.g. Bro. Abdullahi (Lagos Delegation / Room 14)"
                                    className="h-9 text-xs mt-1 bg-white"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        Reviewed directly by Camp Amir & Central Leadership Committee.
                    </p>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-8 h-11 shadow-md transition-all active:scale-95"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                        ) : (
                            <><Send className="w-4 h-4 mr-2" /> Send to Leadership</>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
