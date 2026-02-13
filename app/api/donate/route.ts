import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, payments } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reference, email, amount, jurisdiction } = body;

        if (!reference || !amount) {
            return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 });
        }

        // Resolve Organization
        let organizationId = null;
        let orgNameMatch = "The Muslim Congress"; // Default

        if (jurisdiction) {
            const { level, state, lga, branch } = jurisdiction;
            // logic to find organization ID based on names
            // This is a "best effort" match against the DB.
            let queryName = "";
            if (level === "National") queryName = "The Muslim Congress";
            else if (level === "State") queryName = state;
            else if (level === "LGA") queryName = lga;
            else if (level === "Branch") queryName = branch;

            if (queryName) {
                const org = await db.query.organizations.findFirst({
                    where: (organizations, { or, eq, like }) => or(
                        eq(organizations.name, queryName),
                        like(organizations.name, `%${queryName}%`)
                    )
                });
                if (org) {
                    organizationId = org.id;
                }
            }
        }

        const payment = await db.insert(payments).values({
            amount: (parseFloat(amount) / 100).toString(), // Convert kobo to Naira for storage
            currency: "NGN",
            status: "SUCCESS", // Assumed success from client callback, ideally verify with Paystack backend API
            paymentType: "DONATION",
            paystackRef: reference.reference,
            paystackResponse: reference,
            organizationId: organizationId,
            description: `Donation to ${jurisdiction?.level} - ${jurisdiction?.branch || jurisdiction?.lga || jurisdiction?.state || "National"}`,
            metadata: {
                email,
                jurisdiction
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true, paymentId: payment[0]?.insertId });
    } catch (error) {
        console.error("Donation processing error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
