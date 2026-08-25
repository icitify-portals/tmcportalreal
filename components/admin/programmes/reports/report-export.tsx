"use client";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ReportExport({ summary, details, metaLabel }: { summary: any; details: any[]; metaLabel: string }) {
  function toCSV() {
    const header = ["Date", "Title", "Jurisdiction", "Office", "Officer", "Status", "Male", "Female", "TotalAttendees", "Spent", "ReportSubmittedBy"];
    const rows = details.map((d) => {
      const date = new Date(d.startDate).toISOString().slice(0, 10);
      const total = d.report ? d.report.attendeesMale + d.report.attendeesFemale : 0;
      return [date, `"${(d.title || "").replace(/"/g, '""')}"`, d.organizationName, d.officeName ?? "", d.officialName ?? "", d.status, d.report?.attendeesMale ?? "", d.report?.attendeesFemale ?? "", total, d.report?.amountSpent ?? "", d.report?.submittedByName ?? ""].join(",");
    });
    return [header.join(","), ...rows].join("\n");
  }

  function downloadCSV() {
    const csv = toCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `programme-reports-${metaLabel.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  async function downloadPDF() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc: any = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    const title = `Cumulative Programme Reports — ${metaLabel}`;
    doc.setFontSize(14);
    doc.text(title, 40, 30);
    doc.setFontSize(9);
    doc.text(`Summary: ${summary.totalProgrammes} programmes • ${summary.completed} completed • ${summary.totalAttendees} attendees (${summary.totalMale}M/${summary.totalFemale}F) • ₦${Number(summary.totalSpent).toLocaleString()} spent`, 40, 48);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 62);
    const body = details.map((d) => [
      new Date(d.startDate).toLocaleDateString(),
      d.title,
      d.organizationName,
      d.officeName ?? "—",
      d.officialName ?? "—",
      d.status,
      d.report ? String(d.report.attendeesMale + d.report.attendeesFemale) : "—",
      d.report ? `₦${Number(d.report.amountSpent).toLocaleString()}` : "—",
      d.report?.submittedByName ?? "—",
    ]);
    (autoTable as any)(doc, {
      head: [["Date", "Title", "Jurisdiction", "Office", "Officer", "Status", "Attendees", "Spent", "Submitted By"]],
      body,
      startY: 74,
      styles: { fontSize: 7, cellPadding: 4 },
      headStyles: { fillColor: [3, 20, 8], textColor: [167, 243, 208] },
    });
    doc.save(`programme-reports-${metaLabel.replace(/\s/g, "_")}.pdf`);
    toast.success("PDF downloaded");
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Programme Reports — ${metaLabel}`, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> CSV</Button>
      <Button variant="outline" size="sm" onClick={downloadPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
      <Button size="sm" onClick={share} className="bg-[#031408] text-emerald-100 hover:bg-[#0c2413]"><Share2 className="w-4 h-4 mr-2" /> Share link</Button>
    </div>
  );
}
