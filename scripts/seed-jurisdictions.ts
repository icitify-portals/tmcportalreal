
import "dotenv/config" // Explicitly load .env
import { db } from "@/lib/db"
import { jurisdictionCodes } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const COUNTRY_CODE = "01" // Nigeria

const STATE_CODES: Record<string, string> = {
    "Lagos": "01",
    "Ogun": "02",
    "Oyo": "03",
    "Osun": "04",
    "Kwara": "05",
    "Edo": "06",
    "Ondo": "07",
    "Ekiti": "08",
    "Niger": "09",
    "FCT - Abuja": "10",
}

async function seed() {
    console.log("Seeding Jurisdiction Codes...")

    // 1. Seed Country (Nigeria)
    let country = await db.query.jurisdictionCodes.findFirst({
        where: and(
            eq(jurisdictionCodes.type, "COUNTRY"),
            eq(jurisdictionCodes.name, "Nigeria")
        )
    })

    if (!country) {
        console.log("Creating Nigeria...")
        await db.insert(jurisdictionCodes).values({
            type: "COUNTRY",
            name: "Nigeria",
            code: COUNTRY_CODE,
        })
        country = await db.query.jurisdictionCodes.findFirst({
            where: and(
                eq(jurisdictionCodes.type, "COUNTRY"),
                eq(jurisdictionCodes.name, "Nigeria")
            )
        })
    } else {
        console.log("Nigeria already exists.")
    }

    if (!country) throw new Error("Failed to create/fetch country")

    // 2. Seed States
    for (const [stateName, code] of Object.entries(STATE_CODES)) {
        const existing = await db.query.jurisdictionCodes.findFirst({
            where: and(
                eq(jurisdictionCodes.type, "STATE"),
                eq(jurisdictionCodes.parentId, country.id),
                eq(jurisdictionCodes.name, stateName)
            )
        })

        if (!existing) {
            console.log(`Creating ${stateName} (${code})...`)
            await db.insert(jurisdictionCodes).values({
                type: "STATE",
                name: stateName,
                code: code,
                parentId: country.id
            })
        } else {
            console.log(`${stateName} already exists.`)
        }
    }

    console.log("Seeding complete.")
    process.exit(0)
}

seed().catch((err) => {
    console.error(err)
    process.exit(1)
})
