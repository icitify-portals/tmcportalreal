import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { requireAuth } from "@/lib/rbac"
import { initializePayment, createPaymentRecord } from "@/lib/payments"
import { createAuditLog } from "@/lib/audit"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"


export async function POST(request: NextRequest) {
  try {
    const rawSession = await getServerSession()
    const session = requireAuth(rawSession)

    const body = await request.json()
    const { amount, paymentType, description, memberId, organizationId } = body

    // 2. Resolve organization and subaccount
    const targetOrgId = organizationId || session?.user?.organizationId
    let subaccount: string | undefined = undefined

    if (targetOrgId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, targetOrgId),
        columns: {
          paystackSubaccountCode: true
        }
      })
      if (org?.paystackSubaccountCode) {
        subaccount = org.paystackSubaccountCode
      }
    }

    // Create payment record
    const payment = await createPaymentRecord({
      userId: session?.user?.id,
      organizationId: targetOrgId,
      memberId: memberId || session?.user?.memberId,
      amount,
      paymentType: paymentType || "MEMBERSHIP_FEE",
      description,
    })

    // Initialize Paystack payment
    const result = await initializePayment({
      email: session.user.email,
      amount,
      reference: payment.id,
      callbackUrl: `${process.env.NEXTAUTH_URL}/dashboard/payments/callback`,
      subaccount, // Route funds to jurisdiction subaccount if exists
      metadata: {
        paymentId: payment.id,
        userId: session.user.id,
        memberId: memberId || session.user.memberId,
      },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Update payment with Paystack reference
    await createPaymentRecord({
      userId: session?.user?.id,
      organizationId: organizationId || session?.user?.organizationId,
      memberId: memberId || session?.user?.memberId,
      amount,
      paymentType: paymentType || "MEMBERSHIP_FEE",
      description,
      paystackRef: result.reference,
    })

    await createAuditLog({
      userId: session?.user?.id,
      action: "INITIALIZE_PAYMENT",
      entityType: "Payment",
      entityId: payment.id,
      description: `Initialized payment of ₦${amount}`,
    })

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

