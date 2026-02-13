import path from "path"
import dotenv from "dotenv"

// Load .env explicitly from root
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

console.log("Loading env from:", envPath);
console.log("DATABASE_URL Loaded:", process.env.DATABASE_URL ? "YES (Filtered)" : "NO");

import { db } from "../lib/db"
import { navigationItems } from "../lib/db/schema"
import { eq } from "drizzle-orm"

const MENU_ITEMS = [
    { label: "Home", path: "/", order: 0, type: "link" },
    { label: "Dashboard", path: "/dashboard", order: 1, type: "link" }, // Maybe button? User listed it first/second.
    { label: "Constitution", path: "/constitution", order: 2, type: "link" },
    { label: "Adhkar Centres", path: "/adhkar", order: 3, type: "link" },
    { label: "Teskiyah Centres", path: "/teskiyah", order: 4, type: "link" },
    { label: "Connect", path: "/connect", order: 5, type: "link" },
    { label: "Events", path: "/programmes", order: 6, type: "link" },
    { label: "Donate", path: "/donate", order: 7, type: "link" },
    { label: "Media Library", path: "/media", order: 8, type: "link" },
]

async function seedNavigation() {
    console.log("Seeding navigation items...")

    try {
        // Optional: Clear existing items?
        // await db.delete(navigationItems) 

        for (const item of MENU_ITEMS) {
            // Check if exists
            const existing = await db.query.navigationItems.findFirst({
                where: eq(navigationItems.label, item.label)
            })

            if (!existing) {
                await db.insert(navigationItems).values({
                    label: item.label,
                    path: item.path,
                    order: item.order,
                    type: item.type as any,
                    isActive: true
                })
                console.log(`Added: ${item.label}`)
            } else {
                console.log(`Skipped (Exists): ${item.label}`)
            }
        }
        console.log("Navigation seeding completed.")
    } catch (error) {
        console.error("Error seeding navigation:", error)
    }
}

seedNavigation()
