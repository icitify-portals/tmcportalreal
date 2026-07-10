import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    try { await connection.query("ALTER TABLE programmes ADD COLUMN flyerUrl VARCHAR(500)"); } catch(e){}
    try { await connection.query("ALTER TABLE programmes ADD COLUMN pricingTiers JSON"); } catch(e){}
    try { await connection.query("ALTER TABLE programmes ADD COLUMN isRecurringAdmin BOOLEAN DEFAULT FALSE"); } catch(e){}
    try { await connection.query("ALTER TABLE programme_registrations ADD COLUMN registrationTier VARCHAR(255)"); } catch(e){}
    await connection.end();
    console.log("Done adding flyerUrl, pricingTiers, isRecurringAdmin, registrationTier");
    process.exit(0);
}
run();
