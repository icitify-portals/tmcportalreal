import { db } from "./lib/db"
import { organizations } from "./lib/db/schema"
import { eq } from "drizzle-orm"

async function checkSlider() {
    try {
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        })

        if (!org) {
            console.log("National organization not found")
            return
        }

        console.log("Organization Name:", org.name)
        console.log("Welcome Image URL:", org.welcomeImageUrl)
        console.log("Slider Images:", org.sliderImages)

        process.exit(0)
    } catch (error) {
        console.error("Error:", error)
        process.exit(1)
    }
}

checkSlider()
