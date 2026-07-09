import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
        
        try {
            await connection.execute(`ALTER TABLE programmes ADD COLUMN isRecurringAdmin BOOLEAN DEFAULT FALSE`);
            console.log("Added isRecurringAdmin");
        } catch (e: any) {
            console.log("isRecurringAdmin error:", e.message);
        }

        try {
            await connection.execute(`ALTER TABLE programmes ADD COLUMN flyerUrl VARCHAR(255)`);
            console.log("Added flyerUrl");
        } catch (e: any) {
            console.log("flyerUrl error:", e.message);
        }

        try {
            await connection.execute(`ALTER TABLE programmes ADD COLUMN pricingTiers JSON`);
            console.log("Added pricingTiers");
        } catch (e: any) {
            console.log("pricingTiers error:", e.message);
        }

        try {
            await connection.execute(`ALTER TABLE programme_registrations ADD COLUMN registrationTier VARCHAR(255)`);
            console.log("Added registrationTier");
        } catch (e: any) {
            console.log("registrationTier error:", e.message);
        }

        await connection.end();
        console.log("Done");
    } catch (err: any) {
        console.error("Connection error:", err.message);
    }
    process.exit(0);
}
run();
