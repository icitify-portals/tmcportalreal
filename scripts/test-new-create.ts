import "dotenv/config"
import { db } from "../lib/db"
import { programmes, organizations } from "../lib/db/schema"

async function test() {
    try {
        const [org] = await db.select().from(organizations).limit(1)
        if (!org) {
            console.error("No organizations found")
            return
        }

        console.log("Attempting direct Drizzle insert into programmes")
        await db.insert(programmes).values({
            id: "38b975e1-4ea6-4a0b-ba27-982ddb02f851",
            organizationId: org.id,
            title: "ict team",
            description: "ict team training seminar",
            venue: "Anuoluwapo Central Mosque",
            startDate: new Date("2026-05-02T00:00:00.000Z"),
            endDate: new Date("2026-05-02T00:00:00.000Z"),
            time: "11:30",
            level: "NATIONAL",
            targetAudience: "PUBLIC",
            status: "PENDING_NATIONAL",
            organizingOfficeId: null,
            organizingOfficialId: null,
            format: "HYBRID",
            meetingUrl: null,
            frequency: "ONCE",
            objectives: null,
            budget: "0.00",
            committee: null,
            isLateSubmission: false,
            paymentRequired: true,
            allowInstallments: true,
            minInstallmentAmount: "1000.00",
            amount: "5000.00",
            hasCertificate: false,
            certTemplateType: "PARTNER_ONLY",
            certTmcSignature: null,
            certTmcSignatory: null,
            certPartnerName: "ICITIFY SOLUTIONS LIMITED",
            certPartnerLogo: "/uploads/images/1777717539862-alaolatest.jpg",
            certPartnerSignature: "/uploads/images/1777717644676-alaolatest.jpg",
            certPartnerSignatory: "Ceo",
            createdBy: "bea3ace2-2b9b-4868-8798-7a8d5e567a29",
        })
        console.log("Insert succeeded!")
    } catch (err: any) {
        console.error("Test error during insert:", err)
    }
}

test().then(() => process.exit(0))
