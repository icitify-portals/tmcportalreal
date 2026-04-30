import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programmeRegistrations, programmes, organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { jsPDF } from "jspdf";

async function getBase64Image(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/png";
        return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
    } catch (e) {
        return null;
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: registrationId } = await params;

    try {
        const [result] = await db.select({
            registration: programmeRegistrations,
            programme: programmes,
            organization: organizations,
            user: users
        })
        .from(programmeRegistrations)
        .innerJoin(programmes, eq(programmeRegistrations.programmeId, programmes.id))
        .innerJoin(organizations, eq(programmes.organizationId, organizations.id))
        .innerJoin(users, eq(programmeRegistrations.userId, users.id))
        .where(eq(programmeRegistrations.id, registrationId))
        .limit(1);

        if (!result) return new NextResponse("Registration not found", { status: 404 });
        if (result.registration.status !== 'ATTENDED' && result.registration.status !== 'PAID') {
            // For now allow PAID too if they want to download early, but user said "after the programme"
            // Let's stick to ATTENDED as requested for certificates
            if (result.registration.status !== 'ATTENDED') {
                return new NextResponse("Certificate only available for attended participants", { status: 403 });
            }
        }

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // --- Aesthetics: Borders ---
        doc.setDrawColor(21, 128, 61); // Green-700
        doc.setLineWidth(3);
        doc.rect(5, 5, width - 10, height - 10);
        doc.setDrawColor(234, 179, 8); // Gold
        doc.setLineWidth(1);
        doc.rect(8, 8, width - 16, height - 16);

        // --- Background Watermark (Optional: Subtle TMC initials or logo) ---
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(100);
        doc.setFont("helvetica", "bold");
        doc.text("TMC", width / 2, height / 2 + 20, { align: "center", angle: 45 });

        // --- Content ---
        doc.setTextColor(21, 128, 61);
        doc.setFontSize(35);
        doc.setFont("helvetica", "bold");
        doc.text("CERTIFICATE OF PARTICIPATION", width / 2, 40, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("This is to certify that", width / 2, 60, { align: "center" });

        // Name
        doc.setFontSize(30);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(result.registration.name.toUpperCase(), width / 2, 80, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("has successfully participated in the programme titled", width / 2, 100, { align: "center" });

        // Programme Title
        doc.setFontSize(22);
        doc.setTextColor(21, 128, 61);
        doc.setFont("helvetica", "bold");
        doc.text(result.programme.title, width / 2, 120, { align: "center" });

        // Organizer / Partner Text
        doc.setFontSize(14);
        doc.setTextColor(100);
        const template = result.programme.certTemplateType || "TMC_ONLY";
        let organizerText = "Organized by THE MUSLIM CONGRESS (TMC)";
        
        if (template === "BOTH") {
            organizerText = `In conjunction with ${result.programme.certPartnerName || "Partner Organization"}`;
        } else if (template === "PARTNER_ONLY") {
            organizerText = `Organized by ${result.programme.certPartnerName || "Partner Organization"}`;
        }
        doc.text(organizerText, width / 2, 140, { align: "center" });

        // Date
        const dateStr = new Date(result.programme.startDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        doc.text(`Issued on: ${dateStr}`, width / 2, 150, { align: "center" });

        // --- Logos & Signatures ---
        const tmcLogo = "https://tmcng.net/logo.png"; // Default logo
        const partnerLogo = result.programme.certPartnerLogo;
        const tmcSig = result.programme.certTmcSignature;
        const partnerSig = result.programme.certPartnerSignature;

        // Draw Logos
        if (template === "TMC_ONLY" || template === "BOTH") {
            const logoBase64 = await getBase64Image(tmcLogo);
            if (logoBase64) doc.addImage(logoBase64, "PNG", 20, 15, 25, 25);
        }
        if (template === "PARTNER_ONLY" || template === "BOTH") {
            if (partnerLogo) {
                const logoBase64 = await getBase64Image(partnerLogo);
                if (logoBase64) doc.addImage(logoBase64, "PNG", width - 45, 15, 25, 25);
            }
        }

        // Draw Signatures
        const sigY = 175;
        if (template === "TMC_ONLY") {
            // Center TMC signature
            if (tmcSig) {
                const sigBase64 = await getBase64Image(tmcSig);
                if (sigBase64) doc.addImage(sigBase64, "PNG", width / 2 - 20, sigY - 15, 40, 15);
            }
            doc.line(width / 2 - 30, sigY, width / 2 + 30, sigY);
            doc.setFontSize(10);
            doc.text(result.programme.certTmcSignatory || "Authorized Signature", width / 2, sigY + 5, { align: "center" });
            doc.text("The Muslim Congress", width / 2, sigY + 10, { align: "center" });
        } else if (template === "PARTNER_ONLY") {
            // Center Partner signature
            if (partnerSig) {
                const sigBase64 = await getBase64Image(partnerSig);
                if (sigBase64) doc.addImage(sigBase64, "PNG", width / 2 - 20, sigY - 15, 40, 15);
            }
            doc.line(width / 2 - 30, sigY, width / 2 + 30, sigY);
            doc.setFontSize(10);
            doc.text(result.programme.certPartnerSignatory || "Authorized Signature", width / 2, sigY + 5, { align: "center" });
            doc.text(result.programme.certPartnerName || "Partner Organization", width / 2, sigY + 10, { align: "center" });
        } else if (template === "BOTH") {
            // Dual signatures
            // TMC (Left)
            if (tmcSig) {
                const sigBase64 = await getBase64Image(tmcSig);
                if (sigBase64) doc.addImage(sigBase64, "PNG", 40, sigY - 15, 40, 15);
            }
            doc.line(30, sigY, 90, sigY);
            doc.setFontSize(10);
            doc.text(result.programme.certTmcSignatory || "National Amir", 60, sigY + 5, { align: "center" });
            doc.text("The Muslim Congress", 60, sigY + 10, { align: "center" });

            // Partner (Right)
            if (partnerSig) {
                const sigBase64 = await getBase64Image(partnerSig);
                if (sigBase64) doc.addImage(sigBase64, "PNG", width - 80, sigY - 15, 40, 15);
            }
            doc.line(width - 90, sigY, width - 30, sigY);
            doc.text(result.programme.certPartnerSignatory || "Partner Signatory", width - 60, sigY + 5, { align: "center" });
            doc.text(result.programme.certPartnerName || "Partner Organization", width - 60, sigY + 10, { align: "center" });
        }

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Certificate_${result.registration.name.replace(/\s+/g, '_')}.pdf"`
            }
        });

    } catch (error: any) {
        console.error("Certificate Generation Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
