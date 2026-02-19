export const dynamic = 'force-dynamic'

import Link from "next/link"
import { getTmcProgrammes } from "@/lib/actions/tmc-programmes"
import { BookOpen, GraduationCap, Heart, Users, Star, Globe, Shield, Leaf, Sun, Moon, Lightbulb, Zap, Landmark } from "lucide-react"

// Lucide icon map
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, Heart, Users, Star, Globe, Shield, Leaf, Sun, Moon, Lightbulb, Zap,
    GraduationCap,
}

const categoryConfig: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    Spiritual: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", iconBg: "bg-violet-600" },
    Social: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", iconBg: "bg-sky-600" },
    Health: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", iconBg: "bg-rose-600" },
    Economic: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", iconBg: "bg-amber-600" },
    Humanitarian: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", iconBg: "bg-emerald-600" },
}

function getConfig(category: string | null) {
    return categoryConfig[category ?? ""] ?? { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", iconBg: "bg-green-600" }
}

export default async function OurProgrammesPage() {
    const res = await getTmcProgrammes()
    const programmes = res.success && res.data ? res.data : []

    // Get unique categories for stats
    const categories = [...new Set(programmes.map(p => p.category).filter(Boolean))]

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
                        <Link href="/our-programmes" className="opacity-100 underline underline-offset-4 decoration-white/50">Our Programmes</Link>
                        <Link href="/organs" className="opacity-80 hover:opacity-100 transition-opacity">Our Organs</Link>
                        <Link href="/donate" className="opacity-80 hover:opacity-100 transition-opacity">Donate</Link>
                        <Link href="/auth/signin" className="bg-white text-green-700 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-green-50 transition-colors">
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ── Hero Banner ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-700 to-teal-600 text-white" style={{ minHeight: "340px" }}>
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative container mx-auto px-4 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur">
                        <Landmark className="h-4 w-4" />
                        Institutional Programmes
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow">
                        Our Programmes
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                        A holistic approach to individual reformation, physical well-being, and societal harmony —
                        serving the Ummah across Nigeria and beyond.
                    </p>
                    <div className="mt-8 flex justify-center gap-8 text-sm flex-wrap">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{programmes.length}</div>
                            <div className="text-white/70 mt-0.5">Programmes</div>
                        </div>
                        <div className="w-px bg-white/20 hidden sm:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold">{categories.length}</div>
                            <div className="text-white/70 mt-0.5">Focus Areas</div>
                        </div>
                        <div className="w-px bg-white/20 hidden sm:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold">36</div>
                            <div className="text-white/70 mt-0.5">States Reached</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Category Pills ───────────────────────────────────────── */}
            {categories.length > 0 && (
                <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
                    <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide">
                        <a href="#all" className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-green-700 text-white">
                            All
                        </a>
                        {categories.map(cat => {
                            const cfg = getConfig(cat)
                            return (
                                <a key={cat} href={`#${cat?.toLowerCase()}`}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} hover:opacity-80 transition-opacity`}>
                                    {cat}
                                </a>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Programme Cards ──────────────────────────────────────── */}
            <main id="all" className="container mx-auto px-4 py-16 flex-grow">
                {programmes.length === 0 ? (
                    <div className="text-center py-24">
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-500">No programmes published yet</h2>
                        <p className="text-gray-400 mt-2">Check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {programmes.map(p => {
                            const cfg = getConfig(p.category)
                            const IconComponent = iconMap[p.iconName ?? ""] ?? BookOpen
                            return (
                                <div
                                    key={p.id}
                                    id={p.category?.toLowerCase() ?? ""}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Top accent bar */}
                                    <div className={`h-1.5 w-full ${cfg.iconBg} opacity-80`} />

                                    <div className="p-6 flex flex-col flex-grow">
                                        {/* Icon + category */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${cfg.iconBg} text-white shadow-sm shrink-0`}>
                                                <IconComponent className="h-7 w-7" />
                                            </div>
                                            {p.category && (
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                    {p.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-base font-extrabold text-gray-900 tracking-wide uppercase mb-3 group-hover:text-green-700 transition-colors leading-snug">
                                            {p.title}
                                        </h2>

                                        {/* Description */}
                                        {p.description && (
                                            <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                                                {p.description}
                                            </p>
                                        )}
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
                        <Link href="/our-programmes" className="text-white font-semibold">Our Programmes</Link>
                        <Link href="/organs" className="hover:text-white transition-colors">Our Organs</Link>
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
