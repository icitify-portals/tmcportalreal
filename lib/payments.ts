import axios from "axios"
import { db } from "@/lib/db"
import { payments, paymentStatusEnum, paymentTypeEnum, fundraisingCampaigns } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || ""

export interface InitializePaymentData {
  email: string
  amount: number // in naira
  reference?: string
  callbackUrl?: string
  metadata?: Record<string, any>
  subaccount?: string // Paystack subaccount code
}

export async function initializePayment(data: InitializePaymentData) {
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: data.email,
        amount: Math.round(data.amount * 100), // Convert to kobo
        reference: data.reference,
        callback_url: data.callbackUrl,
        metadata: data.metadata,
        subaccount: data.subaccount,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      }
    }

    return {
      success: false,
      error: response.data.message || "Failed to initialize payment",
    }
  } catch (error: any) {
    console.error("Payment initialization error:", error)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Payment initialization failed",
    }
  }
}

export async function verifyPayment(reference: string) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (response.data.status && response.data.data.status === "success") {
      return {
        success: true,
        data: {
          reference: response.data.data.reference,
          amount: response.data.data.amount / 100, // Convert from kobo
          currency: response.data.data.currency,
          status: response.data.data.status,
          customer: response.data.data.customer,
          metadata: response.data.data.metadata,
        },
      }
    }

    return {
      success: false,
      error: "Payment verification failed",
    }
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Payment verification failed",
    }
  }
}

export type Payment = typeof payments.$inferSelect

export async function createPaymentRecord(data: {
  userId?: string
  organizationId?: string
  memberId?: string
  amount: number
  currency?: string
  paymentType: Payment['paymentType']
  description?: string
  paystackRef?: string
  metadata?: Record<string, any>
  campaignId?: string
}) {
  const id = crypto.randomUUID()
  const paymentData = {
    id,
    userId: data.userId,
    organizationId: data.organizationId,
    memberId: data.memberId,
    campaignId: data.campaignId,
    amount: String(data.amount), // decimal expects string or number, but safe to cast
    currency: data.currency || "NGN",
    paymentType: data.paymentType,
    status: "PENDING" as const,
    description: data.description,
    paystackRef: data.paystackRef,
    metadata: data.metadata || {},
  }

  await db.insert(payments).values(paymentData)

  return paymentData
}

export async function updatePaymentStatus(
  paymentId: string,
  status: Payment['status'],
  paystackResponse?: any
) {
  const result = await db.update(payments)
    .set({
      status,
      paystackResponse: paystackResponse || undefined,
      paidAt: status === "SUCCESS" ? new Date() : undefined,
    })
    .where(eq(payments.id, paymentId))

  if (status === "SUCCESS") {
    // Check if campaign and update amount
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId)
    })

    if (payment && payment.campaignId) {
      await db.update(fundraisingCampaigns)
        .set({
          raisedAmount: sql`${fundraisingCampaigns.raisedAmount} + ${payment.amount}`
        })
        .where(eq(fundraisingCampaigns.id, payment.campaignId))
    }
  }

  return result
}

export async function createPaystackSubaccount(data: {
  business_name: string
  settlement_bank: string
  account_number: string
  percentage_charge: number
  description?: string
}) {
  try {
    const response = await axios.post(
      "https://api.paystack.co/subaccount",
      {
        ...data,
        percentage_charge: data.percentage_charge || 0
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data
      }
    }

    return {
      success: false,
      error: response.data.message
    }
  } catch (error: any) {
    console.error("Create subaccount error:", error)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

export async function listBanks() {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })
    return response.data.data // Array of { name, code }
  } catch (error) {
    return []
  }
}


