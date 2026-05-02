import "dotenv/config"
import { createProgramme } from "../lib/actions/programmes"
import { db } from "../lib/db"
import { organizations, users } from "../lib/db/schema"

async function test() {
    try {
        const [org] = await db.select().from(organizations).limit(1)
        if (!org) {
            console.error("No organizations found")
            return
        }

        const payload = {
            title: "Automated Test Programme",
            description: "Detailed description for test programme creation.",
            venue: "Online",
            startDate: new Date(),
            format: "PHYSICAL",
            frequency: "ONCE",
            amount: 0,
            budget: 0,
            allowInstallments: false,
            minInstallmentAmount: 0
        } as any

        console.log("Calling createProgramme with orgId:", org.id)
        const result = await createProgramme(payload, org.id)
        console.log("Result:", result)
    } catch (err) {
        console.error("Test error:", err)
    }
}

test().then(() => process.exit(0))
