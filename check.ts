import "dotenv/config";
import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
    const [rows] = await connection.query("DESCRIBE programmes");
    console.log("Programmes:", (rows as any[]).map(r => r.Field));
    const [rows2] = await connection.query("DESCRIBE programme_registrations");
    console.log("Registrations:", (rows2 as any[]).map(r => r.Field));
    await connection.end();
    process.exit(0);
}
run();
