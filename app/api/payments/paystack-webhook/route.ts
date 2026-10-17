import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { verifySponsorshipPayment } from "@/lib/actions/programme-sponsorship"
import { verifyBulkPayment } from "@/lib/actions/programme-bulk"
import { verifyTogetherPayment } from "@/lib/actions/programme-together"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const signature = req.headers.get("x-paystack-signature")

        // 1. Verify Signature
        const hash = crypto
            .createHmac("sha512", PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(body))
            .digest("hex")

        if (hash !== signature) {
            return new NextResponse("Invalid signature", { status: 401 })
        }

        // 2. Handle Event
        const event = body.event
        const data = body.data

        if (event === "charge.success") {
            const metadata = data.metadata
            const reference = data.reference

            if (metadata?.type === "PROGRAMME_REGISTRATION" && metadata?.registrationId) {
                console.log(`[Webhook] Verifying Programme Registration: ${metadata.registrationId}`)
                await verifyProgrammeRegistrationPayment(metadata.registrationId, reference)
            } else if (metadata?.type === "SPONSORSHIP_POOL" && metadata?.sponsorshipPoolId) {
                console.log(`[Webhook] Verifying Sponsorship Pool: ${metadata.sponsorshipPoolId}`)
                await verifySponsorshipPayment(metadata.sponsorshipPoolId, reference)
            } else if (metadata?.type === "BULK_REGISTRATION_FEE" && metadata?.bulkGroupId) {
                console.log(`[Webhook] Verifying Bulk Registration Group: ${metadata.bulkGroupId}`)
                await verifyBulkPayment(metadata.bulkGroupId, reference)
            } else if (metadata?.type === "TOGETHER_CHECKOUT" && metadata?.registrationId) {
                console.log(`[Webhook] Verifying Together Checkout: ${metadata.registrationId}`)
                await verifyTogetherPayment({
                    registrationId: metadata.registrationId,
                    groupId: metadata.bulkGroupId || undefined,
                    poolId: metadata.sponsorshipPoolId || undefined,
                    reference,
                })
            }
        }

        return NextResponse.json({ status: "success" })
    } catch (error) {
        console.error("Paystack Webhook Error:", error)
        return new NextResponse("Webhook error", { status: 500 })
    }
}
