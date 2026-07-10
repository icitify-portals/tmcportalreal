import { db } from "./lib/db"
import { createProgramme } from "./lib/actions/programmes"

async function run() {
    try {
        const payload = {
            title: "Test Programme",
            description: "Test description that is long enough to pass validation.",
            venue: "Test Venue",
            organizationId: "f0156d35-3a0c-43f1-b847-a72667104b2b", // Assume a valid org ID, I'll let it fail validation if needed
            startDate: new Date().toISOString(),
            targetAudience: "PUBLIC" as const,
            format: "PHYSICAL" as const,
            frequency: "ONCE" as const,
            amount: "0",
            minInstallmentAmount: "0",
            budget: "0",
            attendanceWindow: "3",
            hasCertificate: false,
            paymentRequired: false,
            allowInstallments: false,
            isRecurringAdmin: false,
            certTemplateType: "TMC_ONLY" as const,
            materials: []
        };
        const result = await createProgramme(payload, payload.organizationId);
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
