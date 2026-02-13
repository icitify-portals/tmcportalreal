"use client"

import React, { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { CertificateTemplate, CertificateProps } from './certificate-template'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

export function PDFDownloadButton({ data, fileName }: { data: CertificateProps, fileName: string }) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return <Button variant="outline" disabled>Loading PDF...</Button>

    return (
        <PDFDownloadLink
            document={<CertificateTemplate data={data} />}
            fileName={fileName}
        >
            {({ blob, url, loading, error }) => (
                <Button variant="outline" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {loading ? 'Generating...' : 'Download Certificate'}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
