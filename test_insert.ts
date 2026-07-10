import "dotenv/config";
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { payments } from './lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    const db = drizzle(connection);
    try {
        const result = await db.insert(payments).values({
            userId: '1',
            amount: '5000.00',
            status: 'PENDING',
            paymentType: 'LEVY',
            description: 'Test payment',
        }).$returningId();
        console.log("Result:", result);
    } catch(e) {
        console.error("Error:", e);
    }
    await connection.end();
    process.exit(0);
}
run();
