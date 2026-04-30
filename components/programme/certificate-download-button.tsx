"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import { toast } from "sonner"

interface CertificateDownloadButtonProps {
    registrationId: string
    programmeTitle: string
}

export function CertificateDownloadButton({ registrationId, programmeTitle }: CertificateDownloadButtonProps) {
    const downloadUrl = `/api/programmes/registrations/${registrationId}/certificate`;

    return (
        <Button asChild variant="outline" className="gap-2 w-full border-green-600 text-green-700 hover:bg-green-50">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download Certificate
            </a>
        </Button>
    )
}
