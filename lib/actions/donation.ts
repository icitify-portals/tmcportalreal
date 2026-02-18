
"use server"

import { initializePayment, createPaymentRecord } from "@/lib/payments"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { fundraisingCampaigns, organizations, payments } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const DonationSchema = z.object({
    campaignId: z.string().min(1),
    amount: z.number().min(100, "Minimum donation is ₦100"),
    email: z.string().email(),
    name: z.string().optional(),
    isAnonymous: z.boolean().default(false),
})

export async function initiateDonation(data: z.infer<typeof DonationSchema>) {
    try {
        const validated = DonationSchema.parse(data)
        const session = await getServerSession()

        // Create Payment Record
        const paymentRecord = await createPaymentRecord({
            userId: session?.user?.id,
            campaignId: validated.campaignId,
            amount: validated.amount,
            paymentType: 'DONATION',
            description: `Donation to Campaign`,
            metadata: {
                anonymous: validated.isAnonymous,
                donorName: validated.name,
                email: validated.email
            }
        })

        // Resolve Organization Subaccount
        // User requested that ALL campaign payments go to the National Account
        let subaccount: string | undefined = undefined

        // Fetch National Organization
        const nationalOrg = await db.query.organizations.findFirst({
            where: (organizations, { eq }) => eq(organizations.level, "NATIONAL"),
            columns: {
                paystackSubaccountCode: true
            }
        })

        if (nationalOrg?.paystackSubaccountCode) {
            subaccount = nationalOrg.paystackSubaccountCode
        }
        // If no national subaccount, it defaults to main account (which is correct for National)

        // Initialize with Paystack
        const paystackResult = await initializePayment({
            email: validated.email,
            amount: validated.amount,
            reference: paymentRecord.id,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
            subaccount,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Campaign ID",
                        variable_name: "campaign_id",
                        value: validated.campaignId
                    }
                ]
            }
        })

        if (!paystackResult.success) {
            return { success: false, error: paystackResult.error }
        }

        // Update record with Paystack reference
        // Actually initializePayment returns a NEW reference if we didn't pass one, 
        // OR we passed `paymentRecord.id` as reference so it should match.
        // But `initializePayment` logic in `lib/payments.ts` takes reference as input.

        return { success: true, authorizationUrl: paystackResult.authorizationUrl }

    } catch (error) {
        console.error("Donation initialization failed:", error)
        return { success: false, error: "Failed to initialize donation" }
    }
}

export async function verifyCampaignDonation(reference: string, campaignId: string) {
    try {
        // 1. Verify with Paystack
        const verification = await import("@/lib/payments").then(m => m.verifyPayment(reference))

        if (!verification.success || !verification.data) {
            return { success: false, error: "Payment verification failed" }
        }

        const paystackData = verification.data

        // 2. Check if payment already exists
        const existingPayment = await db.query.payments.findFirst({
            where: (payments, { eq }) => eq(payments.paystackRef, reference)
        })

        if (existingPayment) {
            return { success: true, message: "Payment already recorded" }
        }

        // 3. Create Payment Record
        const paymentId = crypto.randomUUID()
        const amountInNaira = (paystackData.amount / 100).toString();

        await db.insert(payments).values({
            id: paymentId,
            campaignId: campaignId,
            amount: amountInNaira, // Store as Naira
            currency: paystackData.currency,
            status: "SUCCESS",
            paymentType: "DONATION",
            paystackRef: reference,
            paystackResponse: paystackData as any,
            description: `Donation to Campaign`,
            metadata: paystackData.metadata,
            paidAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // 4. Update Campaign Raised Amount
        await db.update(fundraisingCampaigns)
            .set({
                raisedAmount: sql`${fundraisingCampaigns.raisedAmount} + ${paystackData.amount / 100}`
            })
            .where(eq(fundraisingCampaigns.id, campaignId))

        revalidatePath(`/campaigns/${campaignId}`)
        revalidatePath("/") // Update home page progress

        return { success: true }

    } catch (error) {
        console.error("Verification error:", error)
        return { success: false, error: "Failed to verify donation" }
    }
}
