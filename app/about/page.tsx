export const dynamic = 'force-dynamic'

import { PublicNav } from "@/components/layout/public-nav"
import { getOrganizationTree } from "@/lib/org-helper"
import { ClientAboutContent } from "@/components/about/client-about-content"
import { Info, Target, Eye, Globe } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function AboutPage() {
    const tree = await getOrganizationTree()
    
    // Fetch National org for mission/vision
    const nationalOrg = await db.query.organizations.findFirst({
        where: eq(organizations.level, "NATIONAL")
    })

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            {/* ── Navigation ──────────────────────────────────────────── */}
            <PublicNav />

            {/* ── Hero Banner ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-[#0A2F1F] text-white">
                {/* Modern Abstract Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                </div>
                
                <div className="relative container mx-auto px-4 py-24 md:py-32 text-center max-w-5xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold mb-8 uppercase tracking-widest backdrop-blur-sm">
                        <Info className="h-3.5 w-3.5 text-green-400" />
                        Who We Are
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                        Nurturing Faith, <br className="hidden md:block" /> Serving Humanity.
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
                        The Muslim Congress (TMC) is a structural beacon of Islamic excellence, 
                        dedicated to the spiritual and social development of the Ummah.
                    </p>
                </div>
                
                {/* Wave divider */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg className="relative block h-[40px] w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58,112.55,145.22,126.79,235.61,117,321.39,107.45,321.39,56.44,321.39,56.44Z" className="fill-gray-50/50"></path>
                    </svg>
                </div>
            </section>

            {/* ── Mission & Vision ─────────────────────────────────────── */}
            <section className="container mx-auto px-4 -mt-10 relative z-10 grid md:grid-cols-2 gap-8 max-w-6xl">
                {/* Mission */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-green-900/5 border border-white flex flex-col group hover:border-green-100 transition-colors">
                    <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                        <Target className="h-8 w-8 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Our Mission</h2>
                    <div className="text-gray-600 leading-relaxed text-lg font-medium">
                        {nationalOrg?.missionText ? (
                            <div dangerouslySetInnerHTML={{ __html: nationalOrg.missionText }} />
                        ) : (
                            "To establish a dynamic Islamic community through comprehensive education and service."
                        )}
                    </div>
                </div>

                {/* Vision */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-green-900/5 border border-white flex flex-col group hover:border-green-100 transition-colors">
                    <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                        <Eye className="h-8 w-8 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Our Vision</h2>
                    <div className="text-gray-600 leading-relaxed text-lg font-medium">
                        {nationalOrg?.visionText ? (
                            <div dangerouslySetInnerHTML={{ __html: nationalOrg.visionText }} />
                        ) : (
                            "A world unified under the guidance of Islamic principles for the betterment of all mankind."
                        )}
                    </div>
                </div>
            </section>

            {/* ── Leadership Title ─────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-32 text-center max-w-3xl">
                <div className="inline-block h-1.5 w-12 bg-green-600 rounded-full mb-6 mx-auto" />
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6">Meet Our Leadership</h2>
                <p className="text-gray-500 text-lg">
                    Guided by faith and dedication, our officials serve at every level of society — from 
                    national structures to local branches across the country.
                </p>
            </section>

            {/* ── Interactive Content ─────────────────────────────────── */}
            <main className="flex-grow">
                <ClientAboutContent tree={tree} />
            </main>

            {/* ── Call to Action ──────────────────────────────────────── */}
            <section className="container mx-auto px-4 py-20">
                <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Be Part of the Excellence.</h2>
                        <p className="text-green-100/80 mb-10 max-w-xl mx-auto text-lg">
                            Together we can build a better future for the Ummah. Join our mission today.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/auth/signup" className="w-full sm:w-auto px-10 py-4 bg-white text-green-800 font-black rounded-2xl hover:bg-green-50 transition-colors shadow-lg shadow-black/10">
                                JOIN US NOW
                            </Link>
                            <Link href="/donate" className="w-full sm:w-auto px-10 py-4 bg-green-600/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/20 backdrop-blur-sm">
                                SUPPORT OUR CAUSE
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer className="bg-white border-t border-gray-100 py-16">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/logo.png" alt="Logo" className="h-10 w-10 object-contain grayscale opacity-70" />
                            <span className="font-black text-gray-400 text-xl tracking-tighter">THE MUSLIM CONGRESS</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                            <Link href="/" className="hover:text-green-700 transition-colors">Home</Link>
                            <Link href="/about" className="text-green-700">About</Link>
                            <Link href="/programmes" className="hover:text-green-700 transition-colors">Programmes</Link>
                            <Link href="/donate" className="hover:text-green-700 transition-colors">Donate</Link>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400 tracking-widest uppercase">
                        <span>© {new Date().getFullYear()} TMC. All Rights Reserved.</span>
                        <div className="flex items-center gap-6">
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
