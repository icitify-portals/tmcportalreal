
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
}

// Explicitly pass options to avoid initialization error
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});

async function fix() {
    console.log("Connecting to DB via Prisma...");
    try {
        console.log("Fixing invalid zero dates...");
        const tables = ['system_settings', 'users', 'jurisdiction_codes', 'member_id_sequences', 'members', 'organizations'];

        for (const table of tables) {
            try {
                console.log(`Checking ${table}...`);
                const query = `UPDATE ${table} SET updatedAt = NOW() WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`;
                await prisma.$executeRawUnsafe(query);
                console.log(`Fixed ${table}`);
            } catch (err: any) {
                console.log(`Skipping ${table}: ${err.message.split('\n')[0]}`);
            }
        }
        console.log("Date fix complete.");
    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fix().catch(console.error).finally(() => process.exit(0));
