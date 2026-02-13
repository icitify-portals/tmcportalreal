import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { payments, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { generateReceiptPDF } from "@/lib/invoice-generator"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paymentId } = await params
        const session = await getServerSession()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Fetch payment and ensure it belongs to the user or user is admin
        const payment = await db.query.payments.findFirst({
            where: eq(payments.id, paymentId),
            with: {
                user: true,
                organization: true
            }
        })

        if (!payment) {
            return new NextResponse("Payment not found", { status: 404 })
        }

        // Security Check: User can only download their own receipt unless they are admin
        const isAdmin = session.user.isSuperAdmin || (session.user.roles && session.user.roles.length > 0)
        if (payment.userId !== session.user.id && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        if (payment.status !== "SUCCESS") {
            return new NextResponse("Receipt only available for successful payments", { status: 400 })
        }

        const pdfBuffer = await generateReceiptPDF({
            receiptNumber: `RCP-${payment.paystackRef?.slice(0, 8) || payment.id.slice(0, 8)}`,
            paymentMethod: "Online Payment",
            paymentDate: payment.paidAt || payment.createdAt || new Date(),
            organizationName: payment.organization?.name || "The Muslim Congress",
            organizationAddress: payment.organization?.address || undefined,
            organizationEmail: payment.organization?.email || undefined,
            memberName: payment.user?.name || "Member",
            memberId: payment.user?.id || "N/A",
            items: [{
                description: payment.description || "Payment/Contribution",
                amount: parseFloat(payment.amount.toString())
            }],
            totalAmount: parseFloat(payment.amount.toString())
        })

        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="receipt-${paymentId.slice(0, 8)}.pdf"`
            }
        })

    } catch (error: any) {
        console.error("Receipt download error:", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
