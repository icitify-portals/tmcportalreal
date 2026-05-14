"use client"

import { Button } from "@/components/ui/button"
import { Eye, Undo2, MapPin } from "lucide-react"
import { useEffect, useState } from "react"

export function ViewAsBanner() {
    const [mockInfo, setMockInfo] = useState<{ level: string; state?: string; lga?: string } | null>(null)

    useEffect(() => {
        const mode = localStorage.getItem('tmc_view_mode')
        const level = localStorage.getItem('tmc_view_level')
        
        if (mode && level && level !== "SUPER_ADMIN") {
            // Get state/lga from cookies
            const cookies = document.cookie.split('; ')
            const state = cookies.find(c => c.startsWith('tmc_mock_state='))?.split('=')[1]
            const lga = cookies.find(c => c.startsWith('tmc_mock_lga='))?.split('=')[1]
            
            setMockInfo({ 
                level, 
                state: state ? decodeURIComponent(state) : undefined, 
                lga: lga ? decodeURIComponent(lga) : undefined 
            })
        } else {
            setMockInfo(null)
        }
    }, [])

    if (!mockInfo) return null

    const handleExit = () => {
        localStorage.removeItem('tmc_view_mode')
        localStorage.removeItem('tmc_view_level')
        document.cookie = `tmc_mock_level=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        document.cookie = `tmc_mock_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        document.cookie = `tmc_mock_lga=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        document.cookie = `tmc_mock_branch=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        window.location.href = "/dashboard/admin"
    }

    return (
        <div className="bg-green-700 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-[60] animate-in slide-in-from-top duration-300 border-b border-green-600 shadow-md">
            <div className="flex items-center gap-3 text-sm font-medium">
                <div className="bg-green-600 p-1 rounded-full">
                    <Eye className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                    <span>Viewing as <strong>{mockInfo.level.replace('_', ' ')} Admin</strong></span>
                    {(mockInfo.state || mockInfo.lga) && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-800 rounded-full text-[10px]">
                            <MapPin className="h-3 w-3" />
                            <span>{mockInfo.state}{mockInfo.lga ? ` / ${mockInfo.lga}` : ''}</span>
                        </div>
                    )}
                </div>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExit}
                className="h-7 text-xs font-bold bg-green-800 border-green-600 text-white hover:bg-green-900 hover:text-white"
            >
                <Undo2 className="h-3 w-3 mr-1" />
                Exit Mock Mode
            </Button>
        </div>
    )
}
