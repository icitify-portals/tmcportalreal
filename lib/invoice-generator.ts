import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    dueDate?: Date;
    organizationName: string;
    organizationAddress?: string;
    organizationEmail?: string;
    memberName: string;
    memberId: string;
    items: {
        description: string;
        amount: number;
    }[];
    totalAmount: number;
}

export interface ReceiptData extends Omit<InvoiceData, 'dueDate' | 'date' | 'invoiceNumber'> {
    receiptNumber: string;
    paymentMethod: string;
    paymentDate: Date;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    const doc = new jsPDF() as any;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(22, 101, 52); // TMC Green
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Org Details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(data.organizationName, 20, 40);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (data.organizationAddress) doc.text(data.organizationAddress, 20, 45);
    if (data.organizationEmail) doc.text(data.organizationEmail, 20, 50);

    // Invoice Info
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${data.invoiceNumber}`, 140, 40);
    doc.text(`Date: ${data.date.toLocaleDateString()}`, 140, 45);
    if (data.dueDate) doc.text(`Due Date: ${data.dueDate.toLocaleDateString()}`, 140, 50);

    // Member Details
    doc.setFontSize(12);
    doc.text("Bill To:", 20, 70);
    doc.setFontSize(10);
    doc.text(data.memberName, 20, 75);
    doc.text(`Member ID: ${data.memberId}`, 20, 80);

    // Table
    const tableRows = data.items.map(item => [
        item.description,
        `N ${item.amount.toLocaleString()}`
    ]);

    doc.autoTable({
        startY: 90,
        head: [['Description', 'Amount']],
        body: tableRows,
        headStyles: { fillStyle: [22, 101, 52] },
        theme: 'striped'
    });

    const finalY = (doc as any).lastAutoTable.cursor.y;

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: N ${data.totalAmount.toLocaleString()}`, 140, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated document. No signature required.", 105, 280, { align: "center" });

    return Buffer.from(doc.output('arraybuffer'));
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
    const doc = new jsPDF() as any;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(22, 101, 52); // TMC Green
    doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });

    // Org Details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(data.organizationName, 20, 40);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (data.organizationAddress) doc.text(data.organizationAddress, 20, 45);
    if (data.organizationEmail) doc.text(data.organizationEmail, 20, 50);

    // Receipt Info
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt #: ${data.receiptNumber}`, 140, 40);
    doc.text(`Date: ${data.paymentDate.toLocaleDateString()}`, 140, 45);
    doc.text(`Status: PAID`, 140, 50);

    // Member Details
    doc.setFontSize(12);
    doc.text("Received From:", 20, 70);
    doc.setFontSize(10);
    doc.text(data.memberName, 20, 75);
    doc.text(`Member ID: ${data.memberId}`, 20, 80);

    // Table
    const tableRows = data.items.map(item => [
        item.description,
        `N ${item.amount.toLocaleString()}`
    ]);

    doc.autoTable({
        startY: 90,
        head: [['Description', 'Amount']],
        body: tableRows,
        headStyles: { fillStyle: [22, 101, 52] },
        theme: 'striped'
    });

    const finalY = (doc as any).lastAutoTable.cursor.y;

    // Total & Payment Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Paid: N ${data.totalAmount.toLocaleString()}`, 140, finalY + 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Method: ${data.paymentMethod}`, 20, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your payment.", 105, 280, { align: "center" });

    return Buffer.from(doc.output('arraybuffer'));
}
