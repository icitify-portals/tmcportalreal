"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Home, Heart, Menu, Building2, BookOpen,
    MapPin, ChevronDown, Info, FileText, LogIn, UserPlus
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

const aboutItems = [
    { title: "About Us", href: "/about", icon: Info },
    { title: "Constitution", href: "/constitution", icon: FileText },
    { title: "Our Organs", href: "/organs", icon: Building2 },
    { title: "Our Programmes", href: "/our-programmes", icon: BookOpen },
]

const topLevelItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Adhkar Centres", href: "/adhkar", icon: MapPin },
    { title: "Teskiyyah Centres", href: "/teskiyah", icon: MapPin },
    { title: "Donate", href: "/donate", icon: Heart },
]

export function PublicNav() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(false)
    const [mobileAboutOpen, setMobileAboutOpen] = useState(false)
    const aboutRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    useEffect(() => { setMounted(true) }, [])

    // Close About dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
                setAboutOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Check if any about sub-item is active
    const isAboutActive = aboutItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))

    if (!mounted) {
        return (
            <nav className="border-b bg-green-700 sticky top-0 z-50 text-white">
                <div className="container flex h-16 items-center max-w-7xl mx-auto px-4">
                    <span className="font-bold text-xl">TMC Portal</span>
                </div>
            </nav>
        )
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-green-600 bg-green-700 text-white shadow-sm">
            <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4">

                {/* ── Logo ──────────────────────────────────────────────── */}
                <Link href="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo.png" alt="TMC Logo" className="h-9 w-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <span className="hidden sm:inline">TMC Portal</span>
                </Link>

                {/* ── Desktop Nav ────────────────────────────────────────── */}
                <div className="hidden md:flex items-center gap-1 text-sm font-medium">

                    {/* Home */}
                    <Link
                        href="/"
                        className={cn(
                            "px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                            pathname === "/" ? "bg-white/20 font-semibold" : "text-white/85"
                        )}
                    >
                        Home
                    </Link>

                    {/* About dropdown */}
                    <div ref={aboutRef} className="relative">
                        <button
                            onClick={() => setAboutOpen(o => !o)}
                            className={cn(
                                "flex items-center gap-1 px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                                isAboutActive ? "bg-white/20 font-semibold" : "text-white/85"
                            )}
                        >
                            About
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", aboutOpen && "rotate-180")} />
                        </button>

                        {aboutOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-52 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-100 py-1.5 z-50">
                                {aboutItems.map(item => {
                                    const Icon = item.icon
                                    const active = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setAboutOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-green-50 hover:text-green-700",
                                                active ? "bg-green-50 text-green-700 font-semibold" : ""
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-green-600" />
                                            {item.title}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Adhkar Centres */}
                    <Link
                        href="/adhkar"
                        className={cn(
                            "px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                            pathname.startsWith("/adhkar") ? "bg-white/20 font-semibold" : "text-white/85"
                        )}
                    >
                        Adhkar Centres
                    </Link>

                    {/* Teskiyyah Centres */}
                    <Link
                        href="/teskiyah"
                        className={cn(
                            "px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                            pathname.startsWith("/teskiyah") ? "bg-white/20 font-semibold" : "text-white/85"
                        )}
                    >
                        Teskiyyah Centres
                    </Link>

                    {/* Donate */}
                    <Link
                        href="/donate"
                        className={cn(
                            "px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                            pathname.startsWith("/donate") ? "bg-white/20 font-semibold" : "text-white/85"
                        )}
                    >
                        Donate
                    </Link>

                    {/* Divider */}
                    <div className="w-px h-5 bg-white/25 mx-1" />

                    {/* Sign Up / Login */}
                    <Link
                        href="/auth/signin"
                        className="flex items-center gap-1.5 bg-white text-green-700 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-green-50 transition-colors"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        Login
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="flex items-center gap-1.5 border border-white/50 text-white px-4 py-1.5 rounded-full text-sm hover:bg-white/10 transition-colors ml-1"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Sign Up
                    </Link>
                </div>

                {/* ── Mobile Nav ─────────────────────────────────────────── */}
                <div className="flex md:hidden items-center gap-2">
                    <span className="font-bold text-base">TMC</span>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 p-0 bg-green-800 text-white border-green-700">
                            <SheetTitle className="sr-only">Site Navigation</SheetTitle>

                            {/* Mobile header */}
                            <div className="px-6 py-5 border-b border-green-700">
                                <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setIsOpen(false)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/images/logo.png" alt="" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    TMC Portal
                                </Link>
                            </div>

                            <div className="flex flex-col py-3 overflow-y-auto">
                                {/* Home */}
                                <Link href="/"
                                    onClick={() => setIsOpen(false)}
                                    className={cn("flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10", pathname === "/" && "bg-white/15")}
                                >
                                    <Home className="h-4 w-4 shrink-0" /> Home
                                </Link>

                                {/* About (accordion) */}
                                <div>
                                    <button
                                        onClick={() => setMobileAboutOpen(o => !o)}
                                        className={cn("w-full flex items-center justify-between gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10", isAboutActive && "bg-white/15")}
                                    >
                                        <span className="flex items-center gap-3"><Info className="h-4 w-4 shrink-0" /> About</span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileAboutOpen && "rotate-180")} />
                                    </button>
                                    {mobileAboutOpen && (
                                        <div className="bg-green-900/50 py-1">
                                            {aboutItems.map(item => {
                                                const Icon = item.icon
                                                return (
                                                    <Link key={item.href} href={item.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={cn("flex items-center gap-3 pl-10 pr-6 py-2.5 text-sm transition-colors hover:bg-white/10 text-white/80", pathname === item.href && "text-white font-semibold")}
                                                    >
                                                        <Icon className="h-4 w-4 shrink-0" /> {item.title}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Adhkar */}
                                <Link href="/adhkar" onClick={() => setIsOpen(false)}
                                    className={cn("flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10", pathname.startsWith("/adhkar") && "bg-white/15")}
                                >
                                    <MapPin className="h-4 w-4 shrink-0" /> Adhkar Centres
                                </Link>

                                {/* Teskiyyah */}
                                <Link href="/teskiyah" onClick={() => setIsOpen(false)}
                                    className={cn("flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10", pathname.startsWith("/teskiyah") && "bg-white/15")}
                                >
                                    <MapPin className="h-4 w-4 shrink-0" /> Teskiyyah Centres
                                </Link>

                                {/* Donate */}
                                <Link href="/donate" onClick={() => setIsOpen(false)}
                                    className={cn("flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10", pathname.startsWith("/donate") && "bg-white/15")}
                                >
                                    <Heart className="h-4 w-4 shrink-0" /> Donate
                                </Link>

                                {/* Auth */}
                                <div className="mt-4 px-6 pt-4 border-t border-green-700 space-y-2">
                                    <Link href="/auth/signin" onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full bg-white text-green-700 font-semibold py-2 rounded-full text-sm hover:bg-green-50 transition-colors"
                                    >
                                        <LogIn className="h-4 w-4" /> Login
                                    </Link>
                                    <Link href="/auth/signup" onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full border border-white/40 text-white py-2 rounded-full text-sm hover:bg-white/10 transition-colors"
                                    >
                                        <UserPlus className="h-4 w-4" /> Sign Up
                                    </Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    )
}
