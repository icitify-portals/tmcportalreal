"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportRegistrationsCSV({ 
    data, 
    programmeTitle 
}: { 
    data: any[], 
    programmeTitle: string 
}) {
    const handleExport = () => {
        if (data.length === 0) return

        const headers = ["Name", "Email", "Phone", "Gender", "Address", "Country", "State", "LGA", "Branch", "User Type", "Membership ID", "Status", "Amount Paid", "Payment Ref", "Check-In Time", "Check-In By", "Check-Out Time", "Check-Out By", "Registration Date"]
        
        const csvContent = [
            headers.join(","),
            ...data.map(reg => {
                const row = [
                    `"${reg.name}"`,
                    `"${reg.email}"`,
                    `"${reg.phone || ""}"`,
                    `"${reg.gender || ""}"`,
                    `"${(reg.address || "").replace(/"/g, '""')}"`,
                    `"${reg.country || "Nigeria"}"`,
                    `"${reg.state || ""}"`,
                    `"${reg.lga || ""}"`,
                    `"${reg.branch || ""}"`,
                    reg.userId ? "Member" : "Guest",
                    `"${reg.member?.memberId || ""}"`,
                    reg.status,
                    reg.amountPaid || "0.00",
                    `"${reg.paymentReference || ""}"`,
                    reg.checkInTime ? `"${new Date(reg.checkInTime).toLocaleString()}"` : '""',
                    `"${reg.checkInBy || ""}"`,
                    reg.checkOutTime ? `"${new Date(reg.checkOutTime).toLocaleString()}"` : '""',
                    `"${reg.checkOutBy || ""}"`,
                    new Date(reg.registeredAt).toLocaleDateString()
                ]
                return row.join(",")
            })
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `Registrations_${programmeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Button variant="outline" className="h-9" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    )
}
