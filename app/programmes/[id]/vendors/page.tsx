import { getProgrammeVendors, getProgrammeCampDetails } from "@/lib/actions/programme-camp-ops"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/layout/public-nav"
import { Store, ArrowLeft, Phone, MessageSquare, MapPin, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function PublicCampVendorsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [prog, vendorsRes] = await Promise.all([
        getProgrammeCampDetails(id),
        getProgrammeVendors(id)
    ])

    if (!prog) return notFound()

    const vendors = vendorsRes.success ? vendorsRes.data : []

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNav />
            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
                {/* Header Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link 
                        href={`/programmes/${id}/schedule`}
                        className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Camp Schedule
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/programmes/${id}/meals`}
                            className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs"
                        >
                            Food Timetable
                        </Link>
                        <Link 
                            href={`/programmes/${id}/as-i-see-it`}
                            className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs"
                        >
                            "As I See It" Box
                        </Link>
                    </div>
                </div>

                {/* Banner */}
                <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
                    <div className="max-w-2xl space-y-2">
                        <Badge className="bg-white/20 text-white border-none font-bold text-xs uppercase tracking-wider">
                            Camp Bazaar & Commercial Directory
                        </Badge>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Camp Market & Registered Vendors
                        </h1>
                        <p className="text-purple-100 text-xs sm:text-sm">
                            Browse official stands, books, attires, natural remedies, snacks, and services available during {prog.title}.
                        </p>
                    </div>
                </div>

                {/* Vendors Grid */}
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
                        <Store className="w-12 h-12 text-gray-300 mx-auto" />
                        <h3 className="text-base font-bold text-gray-800">No vendors registered yet</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            The camp bazaar directory is currently being populated. Check back shortly!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendors.map((v: any) => (
                            <Card key={v.id} className="rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-white">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black rounded-md mb-1 uppercase tracking-wider">
                                                {v.category?.replace('_', ' ')}
                                            </span>
                                            <h3 className="text-base font-black text-gray-900">{v.businessName}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Proprietor: {v.ownerName}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 font-mono text-xs font-black rounded-lg border border-gray-200">
                                                {v.stallNumber || "STAND"}
                                            </span>
                                        </div>
                                    </div>

                                    {v.description && (
                                        <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            "{v.description}"
                                        </p>
                                    )}
                                </CardContent>

                                <div className="p-3.5 bg-gray-50/80 border-t flex items-center justify-between gap-2">
                                    <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Stall: {v.stallNumber || "Bazaar Tent"}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={`https://wa.me/${v.whatsappNumber?.replace(/\+/g, '') || v.phoneNumber}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-2xs"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                                        </a>
                                        <a 
                                            href={`tel:${v.phoneNumber}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors"
                                        >
                                            <Phone className="w-3.5 h-3.5" /> Call
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
