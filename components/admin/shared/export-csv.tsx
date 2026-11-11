"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportCSVProps {
    data: any[]
    filename: string
    headers: { key: string; label: string }[]
    className?: string
    buttonText?: string
    disabled?: boolean
}

export function ExportCSV({
    data,
    filename,
    headers,
    className,
    buttonText = "Download CSV",
    disabled = false
}: ExportCSVProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return

        const csvRows: string[] = []
        
        // Add headers
        csvRows.push(headers.map(h => `"${(h.label || '').replace(/"/g, '""')}"`).join(","))

        // Add data
        for (const row of data) {
            const values = headers.map(header => {
                const val = getNestedValue(row, header.key)
                const str = val !== null && val !== undefined ? String(val) : ""
                const escaped = str.replace(/"/g, '""')
                return `"${escaped}"`
            })
            csvRows.push(values.join(","))
        }

        // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows/Mac opens UTF-8 properly
        const csvContent = "\uFEFF" + csvRows.join("\r\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Helper to handle nested keys like 'user.name'
    function getNestedValue(obj: any, path: string) {
        if (!obj || !path) return ""
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ""), obj)
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={disabled || !data || data.length === 0}
            className={className}
        >
            <Download className="mr-2 h-4 w-4" />
            {buttonText}
        </Button>
    )
}
