'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EventReportProps {
    report: {
        id: string;
        summary: string;
        attendeesMale?: number | null;
        attendeesFemale?: number | null;
        amountSpent?: string | null; // Decimal comes as string often
        challenges?: string | null;
        submittedAt?: Date | null;
        images?: any; // json type
    };
    programme: {
        title: string;
        venue: string;
        startDate: Date;
        endDate?: Date | null;
        description: string;
    } | null;
}

export function ReportViewModal({ report, programme }: EventReportProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDownloadPdf = async () => {
        const element = reportRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const data = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProperties = pdf.getImageProperties(data);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`event-report-${programme?.title.replace(/\s+/g, '-') || 'doc'}.pdf`);
        } catch (error) {
            console.error("PDF generation failed", error);
        }
    };

    const formatDate = (date: Date | string | undefined | null) => {
        if (!date) return 'N/A';
        if (!mounted) return '...';
        return new Date(date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
    }

    const InfoItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
        <div className="flex flex-col">
            <p className="font-semibold text-sm text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? 'N/A'}</p>
        </div>
    );

    // Parse images if needed (drizzle json might come as object or string depending on driver)
    const images = Array.isArray(report.images) ? report.images : [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Report</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between pr-6 flex-shrink-0">
                    <div className="space-y-1">
                        <DialogTitle>Event Report</DialogTitle>
                        <CardDescription>Submitted on {formatDate(report.submittedAt)}</CardDescription>
                    </div>
                    {/* Move download button to footer or header action area, header needs adjustment for spacing */}
                </DialogHeader>

                <div className="flex justify-end px-6 pb-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white text-black rounded-md border mx-6 mb-6" ref={reportRef}>
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">{programme?.title}</h1>
                            <p className="text-lg text-gray-600">{programme?.venue}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-4">
                                <InfoItem label="Start Date" value={formatDate(programme?.startDate)} />
                                <InfoItem label="End Date" value={formatDate(programme?.endDate)} />
                            </div>
                            <div className="space-y-4">
                                <InfoItem label="Attended (Male)" value={report.attendeesMale} />
                                <InfoItem label="Attended (Female)" value={report.attendeesFemale} />
                                <InfoItem label="Amount Spent" value={report.amountSpent && mounted ? `₦${Number(report.amountSpent).toLocaleString()}` : '0'} />
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                            <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                {report.summary}
                            </div>
                        </div>

                        {report.challenges && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Challenges</h3>
                                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                        {report.challenges}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Event Gallery</h3>
                            {images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.map((url: string, index: number) => (
                                        <div key={index} className="relative aspect-square">
                                            {/* We use standard img tag for PDF generation compatibility often better than Next Image in some cases w/ html2canvas, but Next Image is fine if CORS handled */}
                                            {/* Using simplified img for html2canvas compatibility if external urls */}
                                            <img
                                                src={url}
                                                alt={`Event image ${index + 1}`}
                                                className="rounded-md object-cover w-full h-full"
                                                crossOrigin="anonymous" // Helpful for canvas based operations if allowed by bucket
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No images attached.</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
