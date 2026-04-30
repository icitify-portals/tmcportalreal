"use client"

import { Printer } from "lucide-react"

export function PosterPrintButton() {
    return (
        <button 
            onClick={() => window.print()}
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2"
        >
            <Printer className="w-6 h-6" />
            Print Poster
        </button>
    )
}
