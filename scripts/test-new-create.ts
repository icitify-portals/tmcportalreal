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
            id: "d41d3793-3c3d-4267-b433-c404fc458cc4",
            organizationId: org.id,
            title: "ict workshop",
            description: "for the ict team",
            venue: "TMC Dawah Centre, Ijesha, Lagos",
            startDate: new Date("2026-05-02T00:00:00.000Z"),
            endDate: new Date("2026-05-02T00:00:00.000Z"),
            time: "10:20",
            level: "NATIONAL",
            targetAudience: "PUBLIC",
            status: "PENDING_NATIONAL",
            organizingOfficeId: "51a5d495-a02f-4aaf-a9c1-cc78cf457950",
            organizingOfficialId: "f24da997-520e-4cc6-acc9-867c761bb370",
            format: "PHYSICAL",
            meetingUrl: null,
            frequency: "ONCE",
            objectives: "the ict",
            budget: "200000.00",
            committee: "ict team",
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
            certPartnerLogo: "/uploads/images/1777713457281-tmc-logo.png",
            certPartnerSignature: "/uploads/images/1777713470060-traffic.jfif",
            certPartnerSignatory: "Ceo",
            createdBy: "bea3ace2-2b9b-4868-8798-7a8d5e567a29",
        })
        console.log("Insert succeeded!")
    } catch (err: any) {
        console.error("Test error during insert:", err)
    }
}

test().then(() => process.exit(0))
