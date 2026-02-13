import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PageHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-green-700/95 backdrop-blur supports-[backdrop-filter]:bg-green-700/60 text-white shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Link href="/">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" alt="TMC Logo" className="h-10 w-10 object-contain" />
                    </Link>
                    <span>TMC Portal</span>
                    <span className="hidden md:inline font-light opacity-80 mx-2">|</span>
                    <span className="hidden md:inline text-sm font-medium bg-green-800/50 px-3 py-1 rounded-full border border-green-600/50">National Headquarters</span>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="text-green-100 hover:text-white transition-colors">Home</Link>
                    <Link href="/connect" className="hover:text-green-200 transition-colors">Connect</Link>
                    <Link href="/constitution" className="text-white hover:text-green-200 transition-colors font-bold border-b-2 border-white pb-1 mt-1">Constitution</Link>
                    <Link href="#" className="hover:text-green-200 transition-colors">Donate</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="bg-white text-green-800 hover:bg-green-50 px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm">
                        Member Login
                    </Link>
                </div>
            </div>
        </header>
    )
}
