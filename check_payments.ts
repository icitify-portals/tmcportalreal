import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    try {
        const [payments] = await connection.query("SELECT id, userId, amount, paymentStatus, paymentType, description, paystackRef, createdAt, paidAt FROM payments ORDER BY createdAt DESC LIMIT 5");
        console.log("Recent Payments:");
        console.table(payments);

        const [registrations] = await connection.query("SELECT id, name, amountPaid, paymentReference, status, registeredAt FROM programme_registrations ORDER BY registeredAt DESC LIMIT 5");
        console.log("Recent Registrations:");
        console.table(registrations);
    } catch(e) {
        console.error(e);
    }
    await connection.end();
    process.exit(0);
}
run();
