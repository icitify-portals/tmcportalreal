"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
    Utensils, 
    Clock, 
    Star, 
    Plus, 
    Trash2, 
    Loader2, 
    ArrowLeft, 
    ThumbsUp, 
    MessageSquare, 
    Calendar,
    Sun,
    Moon,
    Coffee,
    TrendingUp
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
    getMealRatingsAnalytics,
    createProgrammeMealSchedule,
    deleteProgrammeMealSchedule
} from "@/lib/actions/programme-camp-ops"

export default function AdminProgrammeMealsPage() {
    const params = useParams()
    const id = params.id as string

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // New Meal Form
    const [showAddForm, setShowAddForm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [dayNumber, setDayNumber] = useState(1)
    const [date, setDate] = useState("")
    const [mealType, setMealType] = useState("BREAKFAST")
    const [menuTitle, setMenuTitle] = useState("")
    const [servingTime, setServingTime] = useState("")
    const [venue, setVenue] = useState("Main Dining Hall")
    const [description, setDescription] = useState("")

    const loadData = async () => {
        setLoading(true)
        const res = await getMealRatingsAnalytics(id)
        if (res.success) {
            setData(res)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    async function handleAddMeal(e: React.FormEvent) {
        e.preventDefault()
        if (!menuTitle.trim()) {
            toast.error("Menu title is required")
            return
        }

        setIsSaving(true)
        try {
            const res = await createProgrammeMealSchedule({
                programmeId: id,
                dayNumber,
                date,
                mealType,
                menuTitle,
                servingTime,
                venue,
                description,
            })

            if (res.success) {
                toast.success("Meal scheduled successfully")
                setShowAddForm(false)
                setMenuTitle("")
                setDescription("")
                loadData()
            } else {
                toast.error(res.error || "Failed to schedule meal")
            }
        } catch (err) {
            toast.error("Error creating meal")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(mealId: string) {
        if (!confirm("Are you sure you want to delete this scheduled meal?")) return
        try {
            const res = await deleteProgrammeMealSchedule(mealId, id)
            if (res.success) {
                toast.success("Meal schedule removed")
                loadData()
            } else {
                toast.error(res.error || "Failed to delete")
            }
        } catch (err) {
            toast.error("Error deleting meal")
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href={`/dashboard/admin/programmes`}
                            className="inline-flex items-center text-xs font-bold text-amber-800 hover:text-amber-900 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Programmes
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welfare & Feeding Management</h1>
                        <p className="text-sm text-gray-500 font-medium">Daily Food Timetable, Serving Schedule & Live Quality Ratings</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800">
                            <Link href={`/dashboard/admin/programmes/${id}/schedule`}>
                                Event Schedule
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-800">
                            <Link href={`/dashboard/admin/programmes/${id}/as-i-see-it`}>
                                As I See It Box
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                            <Link href={`/programmes/${id}/meals`} target="_blank">
                                Public Delegate Menu ↗
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Overall Feedback Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border border-amber-200 bg-amber-50/40">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-amber-700">Average Food Rating</CardDescription>
                            <CardTitle className="text-3xl font-black text-amber-900 flex items-center gap-2">
                                <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
                                {data?.overallAverage || "0.0"} <span className="text-sm text-gray-500 font-normal">/ 5.0</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-amber-800 font-medium">
                            Based on {data?.totalReviews || 0} delegate meal reviews
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-gray-500">Scheduled Meals</CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">
                                {data?.meals?.length || 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-500 font-medium">
                            Breakfast, Lunch, Dinner & Special Menus
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-gray-500">Welfare Action Status</CardDescription>
                            <CardTitle className="text-xl font-bold text-emerald-700 flex items-center gap-2 pt-1">
                                <TrendingUp className="w-5 h-5 text-emerald-600" /> Live Monitored
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-500 font-medium">
                            Real-time feedback alerts enabled for kitchen staff
                        </CardContent>
                    </Card>
                </div>

                {/* Actions & New Meal */}
                <div className="flex justify-between items-center pt-2">
                    <h2 className="text-lg font-bold text-gray-900">Scheduled Camp Menus</h2>
                    <Button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Menu Item
                    </Button>
                </div>

                {/* New Meal Drawer */}
                {showAddForm && (
                    <Card className="border-2 border-amber-500/30 bg-amber-50/20 shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-gray-900">Schedule Camp Meal</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleAddMeal}>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Day Number</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            value={dayNumber} 
                                            onChange={(e) => setDayNumber(Number(e.target.value))} 
                                            required 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Meal Type</Label>
                                        <select 
                                            value={mealType} 
                                            onChange={(e) => setMealType(e.target.value)}
                                            className="w-full h-10 border rounded-md px-3 bg-white text-xs font-bold"
                                        >
                                            <option value="BREAKFAST">Breakfast</option>
                                            <option value="LUNCH">Lunch</option>
                                            <option value="DINNER">Dinner</option>
                                            <option value="SAHUR">Sahur (Fast)</option>
                                            <option value="IFTAR">Iftar (Fast)</option>
                                            <option value="SNACK">Snack / Refreshment</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Serving Window</Label>
                                        <Input 
                                            value={servingTime} 
                                            onChange={(e) => setServingTime(e.target.value)} 
                                            placeholder="e.g. 7:00 AM - 8:30 AM" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Menu Dish / Title</Label>
                                        <Input 
                                            value={menuTitle} 
                                            onChange={(e) => setMenuTitle(e.target.value)} 
                                            placeholder="e.g. Jollof Rice, Fried Chicken & Coleslaw" 
                                            required 
                                            className="bg-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold">Serving Dining Hall / Venue</Label>
                                        <Input 
                                            value={venue} 
                                            onChange={(e) => setVenue(e.target.value)} 
                                            placeholder="e.g. Main Dining Hall / Kitchen Station A" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Special Notes / Ingredients / Diets (Optional)</Label>
                                    <Textarea 
                                        rows={2} 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder="Notes on dietary options, fruit sides, or tea provisions..." 
                                        className="bg-white text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Meal Schedule"}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                )}

                {/* Meals List with Live Satisfaction */}
                <div className="space-y-4">
                    {data?.meals?.length === 0 ? (
                        <Card className="text-center py-12 border-dashed">
                            <CardContent className="space-y-2">
                                <Utensils className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-500 font-medium">No meals configured yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        data?.meals?.map((meal: any) => (
                            <Card key={meal.id} className="border border-gray-200 bg-white">
                                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-bold text-[10px]">
                                                Day {meal.dayNumber}
                                            </Badge>
                                            <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                {meal.mealType}
                                            </Badge>
                                            {meal.servingTime && (
                                                <span className="text-xs font-mono font-semibold text-gray-600 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                    {meal.servingTime}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{meal.menuTitle}</h3>
                                        <p className="text-xs text-gray-500">{meal.venue} · {meal.description || "Regular camp meal"}</p>
                                    </div>

                                    {/* Satisfaction Indicator */}
                                    <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 shrink-0">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Score</p>
                                            <p className="text-lg font-black text-amber-600 flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                                {meal.avgRating > 0 ? meal.avgRating : "—"}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Reviews</p>
                                            <p className="text-lg font-black text-gray-800">{meal.totalRatings}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDelete(meal.id)}
                                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
