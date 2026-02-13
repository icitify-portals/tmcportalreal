import { NextRequest, NextResponse } from "next/server"
import { verifyPayment, updatePaymentStatus } from "@/lib/payments"
import { createAuditLog } from "@/lib/audit"
import { db } from "@/lib/db"
import { payments, organizations, users } from "@/lib/db/schema"
import { sendEmail, emailTemplates } from "@/lib/email"
import { generateReceiptPDF } from "@/lib/invoice-generator"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 })
    }

    // Verify payment with Paystack
    const result = await verifyPayment(reference)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 })
    }

    // Find payment by reference
    const payment = await db.query.payments.findFirst({
      where: eq(payments.paystackRef, reference),
      with: {
        user: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment status
    await updatePaymentStatus(
      payment.id,
      result.data.status === "success" ? "SUCCESS" : "FAILED",
      result.data
    )

    // Send confirmation email if successful
    if (result.data && result.data.status === "success" && payment.user) {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, payment.organizationId || ""));

      const receiptBuffer = await generateReceiptPDF({
        receiptNumber: `RCP-${reference.slice(0, 8)}`,
        paymentMethod: "Paystack",
        paymentDate: new Date(),
        organizationName: org?.name || "The Muslim Congress",
        organizationAddress: org?.address || undefined,
        organizationEmail: org?.email || undefined,
        memberName: payment.user.name || "Member",
        memberId: payment.user.id,
        items: [{
          description: payment.description || "Donation/Payment",
          amount: result.data.amount
        }],
        totalAmount: result.data.amount
      });

      await sendEmail({
        to: payment.user.email,
        subject: `Payment Receipt: ${payment.description || "Donation"}`,
        html: `<p>Dear ${payment.user.name},</p><p>Thank you for your payment. Please find your receipt attached.</p>`,
        attachments: [{
          filename: `receipt-${reference.slice(0, 8)}.pdf`,
          content: receiptBuffer
        }]
      })
    }

    await createAuditLog({
      userId: payment.userId || undefined,
      action: "VERIFY_PAYMENT",
      entityType: "Payment",
      entityId: payment.id,
      description: `Verified payment ${reference}`,
    })

    return NextResponse.json({ success: true, payment: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


