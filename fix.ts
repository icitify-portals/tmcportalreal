import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
        await connection.query("ALTER TABLE programme_registrations ADD COLUMN amountPaid DECIMAL(10,2) DEFAULT '0.00', ADD COLUMN paymentReference VARCHAR(255)");
        await connection.end();
        console.log("Done adding amountPaid and paymentReference!");
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error(err);
        }
    }
    process.exit(0);
}
run();
