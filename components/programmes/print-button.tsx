"use client"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
    return (
        <Button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-800 transition-colors shadow-lg shadow-green-700/20"
        >
            <Printer className="w-4 h-4" />
            Print Access Slip
        </Button>
    )
}
