export const dynamic = 'force-dynamic'

import Link from "next/link"
import { getOrgans } from "@/lib/actions/organs"
import { ExternalLink, Building2, Landmark } from "lucide-react"

// Category color map
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    Finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Humanitarian: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    "Food & Nutrition": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Peace & Dialogue": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    Pilgrimage: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    Certification: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    Education: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    Health: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
    Media: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    Other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
}

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase()
}

function getCategoryStyle(category: string | null) {
    return categoryColors[category ?? "Other"] ?? categoryColors["Other"]
}

export default async function OrgansPage() {
    const res = await getOrgans()
    const organs = res.success && res.data ? res.data : []

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* ── Navigation ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full border-b bg-green-700/95 backdrop-blur supports-[backdrop-filter]:bg-green-700/60 text-white shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" alt="TMC Logo" className="h-10 w-10 object-contain" />
                        <span>TMC Portal</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">Home</Link>
                        <Link href="/programmes" className="opacity-80 hover:opacity-100 transition-opacity">Programmes</Link>
                        <Link href="/organs" className="opacity-100 underline underline-offset-4 decoration-white/50">Our Organs</Link>
                        <Link href="/donate" className="opacity-80 hover:opacity-100 transition-opacity">Donate</Link>
                        <Link
                            href="/auth/signin"
                            className="bg-white text-green-700 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-green-50 transition-colors"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ── Hero Banner ─────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-teal-600 text-white"
                style={{ minHeight: "340px" }}
            >
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] pointer-events-none" />

                <div className="relative container mx-auto px-4 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur">
                        <Landmark className="h-4 w-4" />
                        Institutional Organs
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow">
                        Our Organs
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                        The structural pillars dedicated to serving the Ummah — a network of institutions
                        working together under the banner of The Muslim Congress.
                    </p>
                    <div className="mt-8 flex justify-center gap-6 text-sm">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{organs.length}</div>
                            <div className="text-white/70 mt-0.5">Institutions</div>
                        </div>
                        <div className="w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-3xl font-bold">
                                {new Set(organs.map(o => o.category).filter(Boolean)).size}
                            </div>
                            <div className="text-white/70 mt-0.5">Sectors</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Organ Cards ─────────────────────────────────────────── */}
            <main className="container mx-auto px-4 py-16 flex-grow">
                {organs.length === 0 ? (
                    <div className="text-center py-24">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-500">No organs published yet</h2>
                        <p className="text-gray-400 mt-2">Check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {organs.map((organ) => {
                            const catStyle = getCategoryStyle(organ.category)
                            return (
                                <div
                                    key={organ.id}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Card top accent */}
                                    <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-teal-400" />

                                    <div className="p-6 flex flex-col flex-grow">
                                        {/* Logo / Icon */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm flex items-center justify-center shrink-0">
                                                {organ.logoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={organ.logoUrl}
                                                        alt={organ.name}
                                                        className="h-14 w-14 object-contain p-1"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold text-xl">
                                                        {getInitials(organ.name)}
                                                    </div>
                                                )}
                                            </div>
                                            {organ.category && (
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                                    {organ.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-green-700 transition-colors">
                                            {organ.name}
                                        </h2>

                                        {/* Description */}
                                        {organ.description && (
                                            <p className="text-sm text-gray-500 leading-relaxed flex-grow line-clamp-3">
                                                {organ.description}
                                            </p>
                                        )}

                                        {/* CTA */}
                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                            {organ.websiteUrl ? (
                                                <a
                                                    href={organ.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 hover:underline transition-colors group/link"
                                                >
                                                    Visit Website
                                                    <ExternalLink className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No website available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer className="bg-green-950 text-green-100 py-10 border-t border-green-900 mt-auto">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">The Muslim Congress</h3>
                        <p className="text-sm text-green-200/70 mt-1">Serving the Ummah through unity and development.</p>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/programmes" className="hover:text-white transition-colors">Programmes</Link>
                        <Link href="/organs" className="text-white font-semibold">Our Organs</Link>
                        <Link href="/donate" className="hover:text-white transition-colors">Donate</Link>
                        <Link href="/constitution" className="hover:text-white transition-colors">Constitution</Link>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-6 pt-6 border-t border-green-900 text-center text-xs text-green-400/60">
                    © {new Date().getFullYear()} The Muslim Congress. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
