"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Utensils, 
    Clock, 
    MapPin, 
    Star, 
    Calendar, 
    ThumbsUp, 
    MessageSquare, 
    CheckCircle2, 
    Loader2, 
    Coffee, 
    Moon, 
    Sun 
} from "lucide-react"
import { submitProgrammeMealRating } from "@/lib/actions/programme-camp-ops"
import { toast } from "sonner"

interface MealSchedule {
    id: string
    dayNumber: number
    date?: string | null
    mealType: string
    menuTitle: string
    description?: string | null
    servingTime?: string | null
    venue?: string | null
    isActive?: boolean | null
}

interface MealsViewProps {
    programmeId: string
    programmeTitle: string
    meals: MealSchedule[]
    registrationId?: string
    userInitialName?: string
}

export function MealsView({
    programmeId,
    programmeTitle,
    meals,
    registrationId,
    userInitialName
}: MealsViewProps) {
    const dayNumbers = Array.from(new Set(meals.map(m => m.dayNumber))).sort((a, b) => a - b)
    const initialDay = dayNumbers.length > 0 ? dayNumbers[0] : 1
    const [selectedDay, setSelectedDay] = useState<number>(initialDay)

    // Rating modal/drawer state
    const [ratingMealId, setRatingMealId] = useState<string | null>(null)
    const [overallRating, setOverallRating] = useState<number>(5)
    const [tasteRating, setTasteRating] = useState<number>(5)
    const [portionRating, setPortionRating] = useState<number>(5)
    const [timingRating, setTimingRating] = useState<number>(5)
    const [comment, setComment] = useState<string>("")
    const [raterName, setRaterName] = useState<string>(userInitialName || "")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [ratedMealIds, setRatedMealIds] = useState<string[]>([])

    const filteredMeals = meals.filter(m => m.dayNumber === selectedDay)

    const getMealTypeBadge = (type: string) => {
        const t = type.toUpperCase()
        switch (t) {
            case "BREAKFAST":
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Sun className="w-3 h-3 mr-1" /> Breakfast</Badge>
            case "LUNCH":
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Utensils className="w-3 h-3 mr-1" /> Lunch</Badge>
            case "DINNER":
                return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200"><Moon className="w-3 h-3 mr-1" /> Dinner</Badge>
            case "SAHUR":
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Moon className="w-3 h-3 mr-1" /> Sahur</Badge>
            case "IFTAR":
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><Utensils className="w-3 h-3 mr-1" /> Iftar</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Coffee className="w-3 h-3 mr-1" /> {type}</Badge>
        }
    }

    async function handleRatingSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!ratingMealId) return

        setIsSubmitting(true)
        try {
            const res = await submitProgrammeMealRating({
                mealScheduleId: ratingMealId,
                programmeId,
                registrationId,
                raterName: raterName.trim(),
                rating: overallRating,
                tasteRating,
                portionRating,
                timingRating,
                comment: comment.trim(),
            })

            if (res.success) {
                toast.success("Thank you! Your food quality rating has been recorded.")
                setRatedMealIds(prev => [...prev, ratingMealId])
                setRatingMealId(null)
                setComment("")
            } else {
                toast.error(res.error || "Failed to submit rating")
            }
        } catch (err) {
            toast.error("An error occurred while submitting your review.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeRatingMeal = meals.find(m => m.id === ratingMealId)

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Camp Feeding & Food Timetable</h2>
                        <p className="text-xs text-muted-foreground">Track daily meal menus and rate food quality to help the Welfare Committee maintain excellence.</p>
                    </div>
                </div>
            </div>

            {/* Day Selector */}
            {dayNumbers.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {dayNumbers.map(day => (
                        <Button
                            key={day}
                            variant={selectedDay === day ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDay(day)}
                            className={`rounded-full px-5 font-bold transition-all shrink-0 ${
                                selectedDay === day 
                                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md scale-105" 
                                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Day {day}
                        </Button>
                    ))}
                </div>
            )}

            {/* Meals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMeals.length === 0 ? (
                    <div className="col-span-full">
                        <Card className="text-center py-12 border-dashed">
                            <CardContent className="space-y-3">
                                <Utensils className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-500 font-medium">No meals scheduled yet for Day {selectedDay}.</p>
                                <p className="text-xs text-muted-foreground">The Welfare Committee will update the meal timetable shortly.</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    filteredMeals.map(meal => {
                        const hasRated = ratedMealIds.includes(meal.id)
                        return (
                            <Card key={meal.id} className="border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                                <CardHeader className="pb-3 border-b border-gray-50 bg-gradient-to-br from-amber-50/30 to-white">
                                    <div className="flex items-center justify-between mb-1.5">
                                        {getMealTypeBadge(meal.mealType)}
                                        {meal.servingTime && (
                                            <span className="text-xs font-mono text-gray-600 flex items-center gap-1 font-semibold">
                                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                {meal.servingTime}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg font-bold text-gray-900 leading-snug">
                                        {meal.menuTitle}
                                    </CardTitle>
                                    {meal.venue && (
                                        <CardDescription className="text-xs flex items-center gap-1 text-gray-500">
                                            <MapPin className="w-3 h-3" /> {meal.venue}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent className="py-4 text-sm text-gray-600 flex-1">
                                    {meal.description || "Freshly prepared camp meals served hot at the designated dining station."}
                                </CardContent>

                                <CardFooter className="pt-2 pb-4 border-t border-gray-100 bg-gray-50/50">
                                    {hasRated ? (
                                        <div className="w-full text-center text-xs font-bold text-emerald-700 py-1.5 flex items-center justify-center gap-1.5 bg-emerald-50 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4" /> You rated this meal
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setRatingMealId(meal.id)}
                                            className="w-full border-amber-300 text-amber-800 hover:bg-amber-100/70 font-semibold text-xs flex items-center justify-center gap-1.5"
                                        >
                                            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                                            Rate This Meal
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Rating Modal / Popover */}
            {ratingMealId && activeRatingMeal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-white shadow-2xl rounded-3xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="bg-amber-50/70 border-b border-amber-100 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-amber-600 text-white text-[10px] uppercase font-black tracking-wider mb-1">
                                        Food Assessment
                                    </Badge>
                                    <CardTitle className="text-xl font-bold text-gray-900">
                                        {activeRatingMeal.menuTitle}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {activeMealTypeLabel(activeRatingMeal.mealType)} · Day {activeRatingMeal.dayNumber}
                                    </p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setRatingMealId(null)}
                                    className="rounded-full h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                                >
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>

                        <form onSubmit={handleRatingSubmit}>
                            <CardContent className="p-6 space-y-5 text-sm">
                                {/* Overall Star Rating */}
                                <div className="space-y-2 text-center pb-3 border-b border-gray-100">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Overall Meal Rating</Label>
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setOverallRating(star)}
                                                className="focus:outline-hidden hover:scale-110 transition-transform p-1"
                                            >
                                                <Star className={`w-8 h-8 ${
                                                    star <= overallRating 
                                                        ? "text-amber-500 fill-amber-400 drop-shadow-xs" 
                                                        : "text-gray-200"
                                                }`} />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold text-amber-800">
                                        {overallRating === 5 && "⭐ Outstanding / Excellent"}
                                        {overallRating === 4 && "👍 Very Good"}
                                        {overallRating === 3 && "👌 Satisfactory / Average"}
                                        {overallRating === 2 && "⚠️ Needs Improvement"}
                                        {overallRating === 1 && "❌ Poor"}
                                    </p>
                                </div>

                                {/* Detailed Dimension Ratings */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <Label className="text-[11px] font-bold text-gray-600">Taste</Label>
                                        <select
                                            value={tasteRating}
                                            onChange={(e) => setTasteRating(Number(e.target.value))}
                                            className="w-full text-xs font-bold p-1 bg-white border rounded-md"
                                        >
                                            <option value={5}>5 - Superb</option>
                                            <option value={4}>4 - Good</option>
                                            <option value={3}>3 - Fair</option>
                                            <option value={2}>2 - Bland</option>
                                            <option value={1}>1 - Bad</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <Label className="text-[11px] font-bold text-gray-600">Portion</Label>
                                        <select
                                            value={portionRating}
                                            onChange={(e) => setPortionRating(Number(e.target.value))}
                                            className="w-full text-xs font-bold p-1 bg-white border rounded-md"
                                        >
                                            <option value={5}>5 - Generous</option>
                                            <option value={4}>4 - Sufficient</option>
                                            <option value={3}>3 - Just Enough</option>
                                            <option value={2}>2 - Small</option>
                                            <option value={1}>1 - Inadequate</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <Label className="text-[11px] font-bold text-gray-600">Serving Time</Label>
                                        <select
                                            value={timingRating}
                                            onChange={(e) => setTimingRating(Number(e.target.value))}
                                            className="w-full text-xs font-bold p-1 bg-white border rounded-md"
                                        >
                                            <option value={5}>5 - On Time</option>
                                            <option value={4}>4 - Minor Delay</option>
                                            <option value={3}>3 - Delayed</option>
                                            <option value={2}>2 - Late</option>
                                            <option value={1}>1 - Very Late</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Remarks / Feedback for Welfare (Optional)</Label>
                                    <Textarea 
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Any suggestions on taste, pepper level, timing, or hygiene..."
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Your Name (Optional)</Label>
                                    <Input 
                                        value={raterName}
                                        onChange={(e) => setRaterName(e.target.value)}
                                        placeholder="Delegate / Room No."
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setRatingMealId(null)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    size="sm" 
                                    disabled={isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting...</>
                                    ) : (
                                        "Submit Rating"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}

function activeMealTypeLabel(type: string) {
    switch (type.toUpperCase()) {
        case "BREAKFAST": return "Breakfast";
        case "LUNCH": return "Lunch";
        case "DINNER": return "Dinner";
        case "SAHUR": return "Sahur";
        case "IFTAR": return "Iftar";
        default: return type;
    }
}
