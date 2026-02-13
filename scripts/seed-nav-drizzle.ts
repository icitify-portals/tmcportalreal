
import path from "path"
import dotenv from "dotenv"
import { eq } from "drizzle-orm"

// 1. Load Env BEFORE importing DB
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

console.log("Environment loaded from:", envPath);

// 2. Import DB (using require if needed, but dynamic import inside async function is safer for ordering)
// Actually, top level import is hoisted. So we must rely on -r dotenv/config OR dynamic import.
// Let's use dynamic import.

async function seed() {
    console.log("Initializing Drizzle Seed...")

    // Dynamic import to ensure env is loaded first
    const { db } = await import("../lib/db");
    const schema = await import("../lib/db/schema");
    // Access tables from schema object (assuming they are exported)
    const { navigationItems, organizations } = schema;

    // 3. Find National Org
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, 'TMC-NAT')
    })

    if (!org) {
        console.error("❌ National Org (TMC-NAT) not found in Drizzle DB.")
        process.exit(1)
    }

    console.log(`Using Org: ${org.name} (${org.id})`)

    // 4. Define Items
    const MENU_ITEMS = [
        { label: "Home", path: "/", order: 0, type: "link" },
        { label: "Dashboard", path: "/dashboard", order: 1, type: "link" },
        { label: "Constitution", path: "/constitution", order: 2, type: "link" },
        { label: "Adhkar Centres", path: "/adhkar", order: 3, type: "link" },
        { label: "Teskiyah Centres", path: "/teskiyah", order: 4, type: "link" },
        { label: "Connect", path: "/connect", order: 5, type: "link" },
        { label: "Events", path: "/programmes", order: 6, type: "link" },
        { label: "Donate", path: "/donate", order: 7, type: "link" },
        { label: "Media Library", path: "/media", order: 8, type: "link" },
    ]

    // 5. Insert
    for (const item of MENU_ITEMS) {
        try {
            // Check existing
            // Note: Drizzle syntax for findFirst with multiple conditions need `and`
            // But let's just check by label + orgId
            const { and, eq } = await import("drizzle-orm");

            const existing = await db.query.navigationItems.findFirst({
                where: and(
                    eq(navigationItems.label, item.label),
                    eq(navigationItems.organizationId, org.id)
                )
            })

            if (!existing) {
                await db.insert(navigationItems).values({
                    label: item.label,
                    path: item.path,
                    order: item.order,
                    type: item.type as any,
                    isActive: true, // boolean in drizzle schema? Step 164 says boolean.
                    organizationId: org.id
                })
                console.log(`+ Created: ${item.label}`)
            } else {
                console.log(`= Exists: ${item.label}`)
            }

        } catch (err) {
            console.error(`❌ Error on ${item.label}:`, err)
        }
    }

    console.log("Done.")
    process.exit(0)
}

seed().catch(err => {
    console.error("Unhandled Error:", err)
    process.exit(1)
})
