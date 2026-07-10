import "dotenv/config";
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { payments } from './lib/db/schema.js';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    const db = drizzle(connection);
    try {
        const paymentId = crypto.randomUUID();
        const [payment] = await db.insert(payments).values({
            id: paymentId,
            userId: '1',
            amount: '5000.00',
            status: 'PENDING',
            paymentType: 'LEVY',
            description: 'Test payment',
        });
        console.log("Result:", payment);
    } catch(e) {
        console.error("Error inserting:", e);
    }
    await connection.end();
    process.exit(0);
}
run();
