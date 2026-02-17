
"use server"

import { initializePayment, createPaymentRecord } from "@/lib/payments"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { fundraisingCampaigns, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
