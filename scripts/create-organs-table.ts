/**
 * Migration script: Creates the 'organs' table if it doesn't already exist.
 * Run with: npx ts-node --project tsconfig.json scripts/create-organs-table.ts
 * Or: npx tsx scripts/create-organs-table.ts
 */
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function main() {
    console.log("🔧 Creating organs table...")

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`organs\` (
            \`id\` varchar(255) NOT NULL,
            \`name\` varchar(255) NOT NULL,
            \`description\` text,
            \`websiteUrl\` varchar(500),
            \`logoUrl\` varchar(500),
            \`category\` varchar(100),
            \`order\` int DEFAULT 0,
            \`isActive\` boolean DEFAULT true,
            \`createdAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            PRIMARY KEY (\`id\`)
        )
    `)

    console.log("✅ organs table ready!")

    // Seed with existing data from the live /organs page
    const existing = await db.execute(sql`SELECT COUNT(*) as count FROM \`organs\``)
    const count = (existing as any)[0]?.[0]?.count ?? (existing as any)[0]?.count ?? 0

    if (Number(count) === 0) {
        console.log("🌱 Seeding organs with existing data...")
        await db.execute(sql`
            INSERT INTO \`organs\` (\`id\`, \`name\`, \`description\`, \`websiteUrl\`, \`category\`, \`order\`, \`isActive\`) VALUES
            (UUID(), 'Al-Barakah Microfinance Bank', 'A leading microfinance bank providing ethical and accessible financial services.', 'https://albarakahmfb.com/', 'Finance', 1, true),
            (UUID(), 'Zakat and Sadaqat Foundation', 'An organization dedicated to the collection and distribution of Zakat and Sadaqat to empower the needy.', 'https://zakatandsadaqat.org.ng/', 'Humanitarian', 2, true),
            (UUID(), 'Human Concern Foundation International', 'A non-governmental organization focused on humanitarian aid and sustainable development projects.', 'https://hcfing.org', 'Humanitarian', 3, true),
            (UUID(), 'Centre for Global Peace Initiative', 'An initiative committed to promoting peace, dialogue, and understanding across communities.', 'https://cgpi.org.ng', 'Peace & Dialogue', 4, true),
            (UUID(), 'Hajj Mabrur', 'Providing comprehensive services for Hajj and Umrah pilgrims to ensure a blessed journey.', 'https://www.hajjmabrurumrah.com', 'Pilgrimage', 5, true),
            (UUID(), 'Halal Certification Authority', 'The official body for Halal certification, ensuring products and services meet Islamic standards.', 'https://halalcert.com.ng', 'Certification', 6, true),
            (UUID(), 'Al-Khair Foods', 'Provider of quality and wholesome food products.', NULL, 'Food & Nutrition', 7, true)
        `)
        console.log("✅ Seeded 7 organs.")
    } else {
        console.log(`ℹ️  Organs table already has ${count} record(s). Skipping seed.`)
    }

    process.exit(0)
}

main().catch((err) => {
    console.error("❌ Migration failed:", err)
    process.exit(1)
})
