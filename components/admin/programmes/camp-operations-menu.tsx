"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { 
    Tent, 
    Calendar, 
    Utensils, 
    Eye, 
    Users, 
    DoorOpen, 
    Store, 
    ChevronDown,
    ExternalLink
} from "lucide-react"
import Link from "next/link"

export function CampOperationsMenu({ programmeId }: { programmeId: string }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    className="h-9 border-emerald-600 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold shadow-xs gap-1.5"
                >
                    <Tent className="h-4 w-4 text-emerald-700" />
                    Camp Operations
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border border-gray-200">
                <DropdownMenuLabel className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-2">
                    Live Camp Tools
                </DropdownMenuLabel>
                
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/schedule`} className="flex items-center gap-2 py-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-xs">Schedule & Live Ticker</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/meals`} className="flex items-center gap-2 py-2">
                        <Utensils className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-xs">Food Timetable & Ratings</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/as-i-see-it`} className="flex items-center gap-2 py-2">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-xs">"As I See It" Triage Desk</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuLabel className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-2">
                    Security & Bazaar
                </DropdownMenuLabel>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/visitors`} className="flex items-center gap-2 py-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-xs">Visitor Management</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/gate-pass`} className="flex items-center gap-2 py-2">
                        <DoorOpen className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-xs">Gate Pass & Movement</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/dashboard/admin/programmes/${programmeId}/vendors`} className="flex items-center gap-2 py-2">
                        <Store className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-xs">Camp Business & Stalls</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
