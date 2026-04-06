"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportCSVProps {
    data: any[]
    filename: string
    headers: { key: string; label: string }[]
}

export function ExportCSV({ data, filename, headers }: ExportCSVProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return

        const csvRows = []
        
        // Add headers
        csvRows.push(headers.map(h => h.label).join(","))

        // Add data
        for (const row of data) {
            const values = headers.map(header => {
                const val = getNestedValue(row, header.key)
                const escaped = ('' + val).replace(/"/g, '""')
                return `"${escaped}"`
            })
            csvRows.push(values.join(","))
        }

        const csvContent = csvRows.join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Helper to handle nested keys like 'user.name'
    function getNestedValue(obj: any, path: string) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) || ""
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!data || data.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
        </Button>
    )
}
