
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fundraisingCampaigns, organizations, payments } from "@/lib/db/schema"
import { updatePaymentStatus } from "@/lib/payments"
import { eq } from "drizzle-orm"
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
    try {
        console.log("Starting verification...");

        // 1. Get or Create Test Organization
        let org = await db.query.organizations.findFirst()
        if (!org) {
            return NextResponse.json({ success: false, error: "No organization found to test with." }, { status: 400 })
        }

        const TEST_SLUG = `verify-test-${uuidv4().substring(0, 8)}`
        console.log(`Testing with Org: ${org.name}, Slug: ${TEST_SLUG}`);

        // 2. Create Test Campaign
        const campaignId = uuidv4()
        const targetAmount = 50000
        const donationAmount = 5000

        await db.insert(fundraisingCampaigns).values({
            id: campaignId,
            organizationId: org.id,
            title: "Verification Test Campaign",
            slug: TEST_SLUG,
            targetAmount: String(targetAmount),
            status: 'ACTIVE',
            raisedAmount: "0",
        })

        // 3. Create Test Payment
        const paymentId = uuidv4()
        await db.insert(payments).values({
            id: paymentId,
            organizationId: org.id,
            campaignId: campaignId,
            amount: String(donationAmount),
            paymentType: 'DONATION',
            status: 'PENDING',
            description: "Test Donation",
        })

        // 4. Update Payment Status (Trigger Logic)
        await updatePaymentStatus(paymentId, 'SUCCESS', { message: "Verified by script" })

        // 5. Verify Campaign Raised Amount
        const campaign = await db.query.fundraisingCampaigns.findFirst({
            where: eq(fundraisingCampaigns.id, campaignId)
        })

        if (!campaign) throw new Error("Campaign not found after creation")

        const raised = parseFloat(campaign.raisedAmount || "0")

        // Cleanup
        await db.delete(payments).where(eq(payments.id, paymentId))
        await db.delete(fundraisingCampaigns).where(eq(fundraisingCampaigns.id, campaignId))

        if (raised === donationAmount) {
            return NextResponse.json({
                success: true,
                message: "Verification Successful! Raised amount updated correctly.",
                details: {
                    expected: donationAmount,
                    actual: raised
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                message: "Verification Failed! Raised amount mismatch.",
                details: {
                    expected: donationAmount,
                    actual: raised
                }
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error("Verification Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
