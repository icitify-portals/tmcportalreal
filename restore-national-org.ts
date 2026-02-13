
import 'dotenv/config';
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log('🌱 Restoring National Organization...');

    try {
        const existing = await db.query.organizations.findFirst({
            where: eq(organizations.code, 'TMC-NAT')
        });

        if (existing) {
            console.log('✅ National Organization already exists.');
            return;
        }

        await db.insert(organizations).values({
            name: 'The Muslim Congress (National)',
            code: 'TMC-NAT',
            level: 'NATIONAL',
            description: 'National Headquarters',
            country: 'Nigeria',
            isActive: true,
            welcomeMessage: 'Welcome to TMC Portal',
            welcomeImageUrl: '/images/logo.png',
            // Ensure new fields are handled by defaults or nulls, or provide them if necessary
            planningDeadlineMonth: 12,
            planningDeadlineDay: 12
        });

        console.log('✅ Created National Organization');
    } catch (error) {
        console.error('❌ Restoration failed:', error);
        process.exit(1);
    }
}

main();
