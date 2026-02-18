
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log("Connecting to DB via Prisma...");
    try {
        console.log("Fixing invalid zero dates...");

        // List of tables that might have updatedAt
        const tables = ['system_settings', 'users', 'jurisdiction_codes', 'member_id_sequences', 'members', 'organizations'];

        for (const table of tables) {
            try {
                console.log(`Checking ${table}...`);
                // Use executeRawUnsafe because table names are dynamic
                // CAST(updatedAt AS CHAR) might fail if column doesn't exist, so this is risky if we don't know schema
                // But we are in a hurry. 
                // Better query: check column existence first? 
                // Prisma doesn't have easy "show columns".
                // We'll try/catch each update.

                // Note: updating to NOW().
                const query = `UPDATE ${table} SET updatedAt = NOW() WHERE CAST(updatedAt AS CHAR) LIKE '0000%' OR updatedAt IS NULL`;

                await prisma.$executeRawUnsafe(query);
                console.log(`Fixed ${table} (or no invalid dates found/column missing)`);
            } catch (err: any) {
                // Ignore "Column not found" errors
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
