import "dotenv/config"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

async function main() {
    console.log("Checking for National Organization...")

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.level, "NATIONAL"),
    })

    if (org) {
        console.log("National Organization found:", org.name)
        return
    }

    console.log("No National Organization found. Creating one...")

    await db.insert(organizations).values({
        name: "TMC National Headquarters",
        code: "TMC-HQ",
        level: "NATIONAL",
        country: "Nigeria",
        isActive: true,
    })

    console.log("National Organization created successfully.")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
