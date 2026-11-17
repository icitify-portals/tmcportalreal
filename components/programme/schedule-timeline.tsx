"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Clock, 
    MapPin, 
    User, 
    Calendar, 
    Radio, 
    Sparkles, 
    BookOpen, 
    Coffee, 
    Utensils, 
    Flame,
    Share2,
    CheckCircle2
} from "lucide-react"

interface ScheduleItem {
    id: string
    dayNumber: number
    date?: string | null
    startTime: string
    endTime?: string | null
    title: string
    speaker?: string | null
    venue?: string | null
    category?: string | null
    description?: string | null
    isCurrentSession?: boolean | null
    displayOrder?: number | null
}

interface ScheduleTimelineProps {
    programmeTitle: string
    programmeVenue?: string
    nextActionTicker?: string | null
    schedules: ScheduleItem[]
    materialsUrl?: string
}

export function ScheduleTimeline({
    programmeTitle,
    programmeVenue,
    nextActionTicker,
    schedules,
    materialsUrl
}: ScheduleTimelineProps) {
    // Unique days in schedules
    const dayNumbers = Array.from(new Set(schedules.map(s => s.dayNumber))).sort((a, b) => a - b)
    const initialDay = dayNumbers.length > 0 ? dayNumbers[0] : 1
    const [selectedDay, setSelectedDay] = useState<number>(initialDay)

    const filteredSchedules = schedules.filter(s => s.dayNumber === selectedDay)
    const currentSession = schedules.find(s => s.isCurrentSession)

    const getCategoryBadge = (category?: string | null) => {
        const cat = (category || "LECTURE").toUpperCase()
        switch (cat) {
            case "PRAYER":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><Sparkles className="w-3 h-3 mr-1" /> Prayer / Dhikr</Badge>
            case "MEAL":
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Utensils className="w-3 h-3 mr-1" /> Meal</Badge>
            case "WORKSHOP":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><BookOpen className="w-3 h-3 mr-1" /> Workshop</Badge>
            case "SPORT":
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Flame className="w-3 h-3 mr-1" /> Sport / Drill</Badge>
            case "BREAK":
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200"><Coffee className="w-3 h-3 mr-1" /> Break</Badge>
            default:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><BookOpen className="w-3 h-3 mr-1" /> Lecture / Plenary</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Next Action Ticker Banner */}
            {nextActionTicker && (
                <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white p-4 rounded-2xl shadow-md flex items-center gap-3 animate-pulse">
                    <div className="bg-white/20 p-2 rounded-xl shrink-0">
                        <Radio className="w-5 h-5 text-amber-300 animate-spin" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Live Camp Notice / Next Line of Action</p>
                        <p className="text-sm md:text-base font-bold text-white">{nextActionTicker}</p>
                    </div>
                </div>
            )}

            {/* Currently Happening Highlight (if active) */}
            {currentSession && (
                <Card className="border-2 border-emerald-500 bg-emerald-50/40 shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1 rounded-bl-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        Now Happening
                    </div>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            {getCategoryBadge(currentSession.category)}
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {currentSession.startTime} {currentSession.endTime ? `– ${currentSession.endTime}` : ""}
                            </span>
                        </div>
                        <CardTitle className="text-xl md:text-2xl text-emerald-950">{currentSession.title}</CardTitle>
                        {currentSession.speaker && (
                            <CardDescription className="text-emerald-800 font-semibold flex items-center gap-1.5 mt-1">
                                <User className="w-4 h-4 text-emerald-600" /> {currentSession.speaker}
                            </CardDescription>
                        )}
                    </CardHeader>
                    {currentSession.description && (
                        <CardContent className="pt-0 text-sm text-gray-700">
                            {currentSession.description}
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Day Selector Tabs */}
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
                                    ? "bg-green-700 hover:bg-green-800 text-white shadow-md scale-105" 
                                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Day {day}
                        </Button>
                    ))}
                </div>
            )}

            {/* Timeline of Events */}
            <div className="space-y-4">
                {filteredSchedules.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                        <CardContent className="space-y-3">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-gray-500 font-medium">No sessions scheduled yet for Day {selectedDay}.</p>
                            <p className="text-xs text-muted-foreground">The event schedule will appear here as soon as it is published by the camp secretariat.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-green-200 space-y-6 my-4">
                        {filteredSchedules.map((item, index) => {
                            const isCurrent = !!item.isCurrentSession
                            return (
                                <div key={item.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 transition-all ${
                                        isCurrent 
                                            ? "bg-emerald-600 border-white ring-4 ring-emerald-300 scale-125" 
                                            : "bg-white border-green-500 group-hover:scale-110"
                                    }`} />

                                    <Card className={`transition-all duration-200 ${
                                        isCurrent 
                                            ? "border-emerald-500 shadow-md bg-emerald-50/20" 
                                            : "border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white"
                                    }`}>
                                        <CardContent className="p-4 sm:p-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-green-700" />
                                                        {item.startTime} {item.endTime ? `– ${item.endTime}` : ""}
                                                    </span>
                                                    {getCategoryBadge(item.category)}
                                                </div>
                                                {isCurrent && (
                                                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] uppercase">
                                                        Live Now
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                                {item.title}
                                            </h3>

                                            {(item.speaker || item.venue) && (
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2 font-medium">
                                                    {item.speaker && (
                                                        <span className="flex items-center gap-1 text-emerald-800">
                                                            <User className="w-3.5 h-3.5 text-emerald-600" />
                                                            {item.speaker}
                                                        </span>
                                                    )}
                                                    {item.venue && (
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {item.venue}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {item.description && (
                                                <p className="text-xs sm:text-sm text-gray-600 mt-2.5 pt-2 border-t border-gray-100">
                                                    {item.description}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
