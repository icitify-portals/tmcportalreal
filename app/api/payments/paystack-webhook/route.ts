import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyProgrammeRegistrationPayment } from "@/lib/actions/programmes"

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
            }
        }

        return NextResponse.json({ status: "success" })
    } catch (error) {
        console.error("Paystack Webhook Error:", error)
        return new NextResponse("Webhook error", { status: 500 })
    }
}
