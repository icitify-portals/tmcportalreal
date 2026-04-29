"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { getAttendanceTokenAction } from "@/lib/actions/programmes"
import { Loader2, RefreshCcw, Users, Clock, ShieldCheck } from "lucide-react"

export function AttendanceKiosk({ programmeId, programmeTitle }: { programmeId: string, programmeTitle: string }) {
    const [qrUrl, setQrUrl] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState(60)
    const [loading, setLoading] = useState(true)

    const fetchToken = async () => {
        setLoading(true)
        const result = await getAttendanceTokenAction(programmeId)
        if (result.success && result.url) {
            const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(result.url)}`
            setQrUrl(qrApi)
        }
        setLoading(false)
        setTimeLeft(60)
    }

    useEffect(() => {
        fetchToken()
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchToken()
                    return 60
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [programmeId])

    return (
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-2">
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">{programmeTitle}</h1>
                <p className="text-xl text-gray-500 font-medium">Scan with your phone to record attendance</p>
            </div>

            <div className="relative group">
                {/* QR Container */}
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-green-600 relative overflow-hidden transition-all duration-500 group-hover:scale-[1.02]">
                    {loading ? (
                        <div className="w-[400px] h-[400px] flex items-center justify-center bg-gray-50">
                            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                        </div>
                    ) : (
                        qrUrl && (
                            <Image 
                                src={qrUrl} 
                                alt="Attendance QR" 
                                width={400} 
                                height={400} 
                                className="rounded-lg shadow-inner"
                            />
                        )
                    )}
                    
                    {/* Status Overlays */}
                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        SECURE
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-2 bg-gray-100 rounded-full overflow-hidden shadow-sm">
                    <div 
                        className="h-full bg-green-500 transition-all duration-1000 linear"
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-12 pt-8">
                <div className="flex flex-col items-center">
                    <div className="bg-green-50 p-4 rounded-2xl mb-2 text-green-600">
                        <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Next Refresh</p>
                    <p className="text-3xl font-black text-gray-900">{timeLeft}s</p>
                </div>
                
                <div className="w-px h-16 bg-gray-200" />

                <div className="flex flex-col items-center">
                    <div className="bg-blue-50 p-4 rounded-2xl mb-2 text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Instructions</p>
                    <p className="text-xl font-bold text-gray-900">Login to portal & Scan</p>
                </div>
            </div>

            <div className="pt-12 flex items-center gap-4 opacity-30">
                <Image src="/images/logo.png" alt="TMC Logo" width={40} height={40} />
                <p className="text-lg font-bold tracking-widest uppercase">THE MUSLIM CONGRESS</p>
            </div>
        </div>
    )
}
