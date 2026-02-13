"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import { toast } from "sonner"

interface CertificateDownloadButtonProps {
    userName: string
    programmeTitle: string
    date: Date | string
    programmeId: string
}

export function CertificateDownloadButton({ userName, programmeTitle, date, programmeId }: CertificateDownloadButtonProps) {

    const generateCertificate = () => {
        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })

            // Design
            doc.setFillColor(255, 255, 255)
            doc.rect(0, 0, 297, 210, 'F')

            // Border
            doc.setLineWidth(2)
            doc.setDrawColor(20, 83, 45) // TMC Green roughly
            doc.rect(10, 10, 277, 190)

            doc.setLineWidth(0.5)
            doc.rect(15, 15, 267, 180)

            // Header
            doc.setFont("helvetica", "bold")
            doc.setFontSize(30)
            doc.setTextColor(20, 83, 45)
            doc.text("CERTIFICATE OF PARTICIPATION", 148.5, 50, { align: "center" })

            // Subheader
            doc.setFontSize(16)
            doc.setTextColor(100)
            doc.setFont("helvetica", "normal")
            doc.text("This is to certify that", 148.5, 75, { align: "center" })

            // Name
            doc.setFontSize(28)
            doc.setTextColor(0)
            doc.setFont("times", "bolditalic")
            doc.text(userName, 148.5, 95, { align: "center" })

            // Underline name
            doc.setLineWidth(0.5)
            doc.line(70, 97, 227, 97)

            // Text
            doc.setFontSize(16)
            doc.setTextColor(100)
            doc.setFont("helvetica", "normal")
            doc.text("Has successfully participated in the programme:", 148.5, 115, { align: "center" })

            // Programme Title
            doc.setFontSize(22)
            doc.setTextColor(20, 83, 45)
            doc.setFont("helvetica", "bold")
            doc.text(programmeTitle, 148.5, 135, { align: "center" })

            // Date
            doc.setFontSize(14)
            doc.setTextColor(100)
            doc.setFont("helvetica", "normal")
            const dateStr = new Date(date).toLocaleDateString(undefined, { dateStyle: "long" })
            doc.text(`Held on: ${dateStr}`, 148.5, 150, { align: "center" })

            // Signatures
            doc.setLineWidth(0.5)
            doc.line(50, 180, 110, 180) // Left Sig
            doc.line(187, 180, 247, 180) // Right Sig

            doc.setFontSize(12)
            doc.text("Programme Coordinator", 80, 188, { align: "center" })
            doc.text("TMC Official", 217, 188, { align: "center" })

            // Save
            doc.save(`Certificate - ${programmeTitle}.pdf`)
            toast.success("Certificate downloaded")

        } catch (error) {
            console.error("Certificate generation error", error)
            toast.error("Failed to generate certificate")
        }
    }

    return (
        <Button onClick={generateCertificate} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Certificate
        </Button>
    )
}
