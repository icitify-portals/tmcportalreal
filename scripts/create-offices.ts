
import { db } from "../lib/db";
import { offices, organizations } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    const [nat] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1);
    if (!nat) {
        console.error('National Org not found');
        return;
    }

    const officeNames = [
        "Administration Department",
        "Secretariat",
        "Centre for Global Peace Initiative (CGPI)",
        "Information and Publication Affairs (NAIPA)",
        "Asset Maintenance Unit (NAMO)",
        "The Congress Investment Club (TCIC)",
        "The Congress Professionals (TCP)",
        "Financial Department (NAFINS)",
        "Da'wah Affairs Department (NADA)",
        "Drama and Entertainment Unit (HD&E)",
        "IMC and Estate Management",
        "External Affairs (NAEA)",
        "Congress Affairs (NACGA)",
        "Human Concern Foundation International (HCFI)",
        "Da'wah Research Unit (HDRU)",
        "Auditor General Office"
    ];

    console.log('--- Creating National Offices ---');
    for (const name of officeNames) {
        const existing = await db.select().from(offices).where(sql`LOWER(${offices.name}) = LOWER(${name}) AND ${offices.organizationId} = ${nat.id}`).limit(1);
        if (existing.length === 0) {
            await db.insert(offices).values({
                organizationId: nat.id,
                name: name,
                description: `Department of ${name}`,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`Created: ${name}`);
        } else {
            console.log(`Skipped (already exists): ${name}`);
        }
    }
}

main().catch(console.error);
