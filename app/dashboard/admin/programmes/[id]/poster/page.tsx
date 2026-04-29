import { db } from "@/lib/db"
import { programmes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Image from "next/image"
import { getStaticAttendanceUrl } from "@/lib/actions/programmes"
import { ShieldCheck, MapPin, Calendar, Clock, Smartphone } from "lucide-react"
import { format } from "date-fns"

export default async function ProgrammePosterPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) return notFound()

    const result = await getStaticAttendanceUrl(id)
    if (!result.success || !result.url) {
        return <div className="p-12 text-center text-red-600 font-bold">Error generating poster: {result.error}</div>
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(result.url)}`

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center print:p-0">
            {/* Poster Layout */}
            <div className="max-w-[800px] w-full border-[16px] border-green-600 rounded-[3rem] p-12 space-y-12 text-center shadow-2xl print:shadow-none print:border-none">
                
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4 opacity-50 mb-4">
                         <Image src="/images/logo.png" alt="TMC Logo" width={60} height={60} />
                         <p className="text-xl font-bold tracking-widest uppercase text-gray-600">THE MUSLIM CONGRESS</p>
                    </div>
                    <h1 className="text-6xl font-black text-gray-900 leading-tight">
                        {programme.title}
                    </h1>
                    <div className="h-2 w-32 bg-green-500 mx-auto rounded-full" />
                </div>

                {/* QR Code Section */}
                <div className="space-y-6">
                    <p className="text-2xl font-bold text-gray-600 uppercase tracking-widest">
                        Scan to Record Attendance
                    </p>
                    <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200 inline-block relative group">
                        <Image 
                            src={qrUrl} 
                            alt="Attendance QR" 
                            width={450} 
                            height={450} 
                            className="mx-auto"
                        />
                        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                            <ShieldCheck className="w-4 h-4" />
                            OFFICIAL
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="grid grid-cols-3 gap-6 pt-6">
                    <div className="bg-green-50 p-6 rounded-2xl space-y-2">
                        <Smartphone className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="font-bold text-sm text-gray-700">1. Open Camera</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl space-y-2">
                        <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto" />
                        <p className="font-bold text-sm text-gray-700">2. Login to Portal</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-2xl space-y-2">
                        <Clock className="w-8 h-8 text-amber-600 mx-auto" />
                        <p className="font-bold text-sm text-gray-700">3. Check-In</p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="pt-8 border-t border-gray-100 flex items-center justify-around text-gray-500">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">{programme.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">{format(new Date(programme.startDate), "MMMM d, yyyy")}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-400 font-medium uppercase tracking-[0.3em] pt-4">
                    tmcng.net • Empowering the Ummah
                </p>
            </div>

            {/* Print Helper (Hidden on Print) */}
            <div className="mt-12 print:hidden flex items-center gap-4">
                <button 
                    onClick={() => window.print()}
                    className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2"
                >
                    Print Poster
                </button>
                <p className="text-gray-500 font-medium">Recommended: Print on A3 or A4 paper</p>
            </div>
        </div>
    )
}
